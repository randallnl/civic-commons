import { env } from "cloudflare:workers";
import { cleanText } from "./text";
import { adminDb } from "./adminAuth";
import { ensureUnifiedPeopleTables } from "./unifiedPeople";

const TABLE_SQL = `CREATE TABLE IF NOT EXISTS profile_update_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_key TEXT NOT NULL,
  person_name TEXT,
  page_url TEXT,
  submitter_name TEXT,
  submitter_email TEXT,
  website_url TEXT,
  substack_url TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  tiktok_url TEXT,
  x_url TEXT,
  bluesky_url TEXT,
  photo_url TEXT,
  photo_key TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export function profileUpdateDb() {
  return env.d1_db || adminDb();
}

export async function ensureProfileUpdateSubmissionTable(db = profileUpdateDb()) {
  if (!db) throw new Error("D1 database binding is not configured.");
  await db.prepare(TABLE_SQL).run();
  await ensureColumn(db, "profile_update_submissions", "x_url", "TEXT");
  await ensureColumn(db, "profile_update_submissions", "bluesky_url", "TEXT");
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_profile_update_submissions_status
       ON profile_update_submissions(status, created_at)`,
    )
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_profile_update_submissions_person
       ON profile_update_submissions(person_key, status)`,
    )
    .run();
}

export async function createProfileUpdateSubmission(data = {}, db = profileUpdateDb()) {
  await ensureProfileUpdateSubmissionTable(db);
  const normalized = normalizeSubmissionData(data);

  if (!normalized.personKey) throw new Error("Profile identifier is required.");
  if (!normalized.submitterEmail) throw new Error("Email is required for moderation follow-up.");
  if (!hasSuggestedUpdate(normalized)) {
    throw new Error("Add at least one photo, website, social link, or note.");
  }

  const result = await db
    .prepare(
      `INSERT INTO profile_update_submissions (
        person_key, person_name, page_url, submitter_name, submitter_email,
        website_url, substack_url, instagram_url, facebook_url, tiktok_url, x_url, bluesky_url,
        photo_url, photo_key, notes, status, created_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
    )
    .bind(
      normalized.personKey,
      normalized.personName,
      normalized.pageUrl,
      normalized.submitterName,
      normalized.submitterEmail,
      normalized.websiteUrl,
      normalized.substackUrl,
      normalized.instagramUrl,
      normalized.facebookUrl,
      normalized.tiktokUrl,
      normalized.xUrl,
      normalized.blueskyUrl,
      normalized.photoUrl,
      normalized.photoKey,
      normalized.notes,
    )
    .run();

  return result.meta?.last_row_id || result.lastRowId || result.last_row_id;
}

export async function getPendingProfileUpdateSubmissions({ limit = 50 } = {}, db = profileUpdateDb()) {
  if (!db) return [];
  await ensureProfileUpdateSubmissionTable(db);

  const result = await db
    .prepare(
      `SELECT *
       FROM profile_update_submissions
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT ?`,
    )
    .bind(limit)
    .all();

  return (result.results || []).map(normalizeSubmissionRow);
}

export async function countPendingProfileUpdateSubmissions(db = profileUpdateDb()) {
  if (!db) return 0;
  await ensureProfileUpdateSubmissionTable(db);

  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM profile_update_submissions
       WHERE status = 'pending'`,
    )
    .first();

  return Number(row?.count || 0);
}

export async function moderateProfileUpdateSubmission({
  id,
  action = "",
  reviewedBy = "",
} = {}, db = profileUpdateDb()) {
  await ensureProfileUpdateSubmissionTable(db);
  const submission = await db
    .prepare("SELECT * FROM profile_update_submissions WHERE id = ? AND status = 'pending'")
    .bind(Number(id))
    .first();

  if (!submission) throw new Error("No pending profile update submission was found.");

  if (action === "approve") {
    await applyProfileUpdateSubmission(submission, db);
  } else if (action !== "reject") {
    throw new Error("Choose approve or reject.");
  }

  await db
    .prepare(
      `UPDATE profile_update_submissions
       SET status = ?,
           reviewed_by = ?,
           reviewed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .bind(action === "approve" ? "approved" : "rejected", reviewedBy, Number(id))
    .run();

  return normalizeSubmissionRow({ ...submission, status: action === "approve" ? "approved" : "rejected" });
}

export async function uploadPendingProfilePhoto({ file, personKey = "", index = 0 } = {}) {
  const bucket = env.r2_bucket;
  if (!bucket) throw new Error("Photo uploads are temporarily unavailable.");
  if (!file || typeof file === "string" || !file.size) return { photoUrl: "", photoKey: "" };

  const filename = sanitizeFilename(file.name || `profile-photo-${index}.jpg`);
  const key = `pending-profile-updates/${slugify(personKey || "profile")}-${Date.now()}-${index}-${filename}`;
  const contentType = file.type || contentTypeFor(key);

  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType,
      cacheControl: "public, max-age=86400",
    },
  });

  return {
    photoKey: key,
    photoUrl: publicPhotoUrl(key),
  };
}

export function profileUpdateDate(value = "") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

async function applyProfileUpdateSubmission(submission = {}, db = profileUpdateDb()) {
  await ensureUnifiedPeopleTables(db);
  const normalized = normalizeSubmissionRow(submission);
  const data = {
    websiteUrl: normalized.websiteUrl,
    substackUrl: normalized.substackUrl,
    instagramUrl: normalized.instagramUrl,
    facebookUrl: normalized.facebookUrl,
    tiktokUrl: normalized.tiktokUrl,
    xUrl: normalized.xUrl,
    blueskyUrl: normalized.blueskyUrl,
    photoUrl: normalized.photoUrl,
  };
  const assignments = [];
  const values = [];

  for (const [field, column] of [
    ["websiteUrl", "website_url"],
    ["substackUrl", "substack_url"],
    ["instagramUrl", "instagram_url"],
    ["facebookUrl", "facebook_url"],
    ["tiktokUrl", "tiktok_url"],
    ["xUrl", "x_url"],
    ["blueskyUrl", "bluesky_url"],
    ["photoUrl", "photo_url"],
  ]) {
    if (!data[field]) continue;
    assignments.push(`${column} = ?`);
    values.push(data[field]);
  }

  if (!assignments.length) return;

  values.push(normalized.personKey, normalized.personKey, normalized.personKey, numericId(normalized.personKey), numericId(normalized.personKey));
  const result = await db
    .prepare(
      `UPDATE d1_people
       SET ${assignments.join(", ")},
           updated_at = CURRENT_TIMESTAMP
       WHERE slug = ?
          OR filer_entity_number = ?
          OR CAST(id AS TEXT) = ?
          OR gc_personid = ?
          OR employeeno = ?`,
    )
    .bind(...values)
    .run();

  const changes = result.meta?.changes ?? result.changes ?? 0;
  if (!changes) throw new Error("No matching people profile was updated.");
}

function normalizeSubmissionData(data = {}) {
  return {
    personKey: cleanText(data.personKey || data.person_key || ""),
    personName: cleanText(data.personName || data.person_name || ""),
    pageUrl: String(data.pageUrl || data.page_url || "").trim(),
    submitterName: cleanText(data.submitterName || data.submitter_name || "Community member"),
    submitterEmail: String(data.submitterEmail || data.submitter_email || "").trim(),
    websiteUrl: normalizeUrl(data.websiteUrl || data.website_url || ""),
    substackUrl: normalizeSocialUrl(data.substackUrl || data.substack_url || "", "substack"),
    instagramUrl: normalizeSocialUrl(data.instagramUrl || data.instagram_url || "", "instagram"),
    facebookUrl: normalizeSocialUrl(data.facebookUrl || data.facebook_url || "", "facebook"),
    tiktokUrl: normalizeSocialUrl(data.tiktokUrl || data.tiktok_url || "", "tiktok"),
    xUrl: normalizeSocialUrl(data.xUrl || data.x_url || "", "x"),
    blueskyUrl: normalizeSocialUrl(data.blueskyUrl || data.bluesky_url || "", "bluesky"),
    photoUrl: String(data.photoUrl || data.photo_url || "").trim(),
    photoKey: String(data.photoKey || data.photo_key || "").trim(),
    notes: cleanText(data.notes || ""),
  };
}

function normalizeSubmissionRow(row = {}) {
  return {
    id: row.id,
    personKey: row.person_key || row.personKey || "",
    personName: cleanText(row.person_name || row.personName || ""),
    pageUrl: row.page_url || row.pageUrl || "",
    submitterName: cleanText(row.submitter_name || row.submitterName || "Community member"),
    submitterEmail: row.submitter_email || row.submitterEmail || "",
    websiteUrl: row.website_url || row.websiteUrl || "",
    substackUrl: row.substack_url || row.substackUrl || "",
    instagramUrl: row.instagram_url || row.instagramUrl || "",
    facebookUrl: row.facebook_url || row.facebookUrl || "",
    tiktokUrl: row.tiktok_url || row.tiktokUrl || "",
    xUrl: row.x_url || row.xUrl || "",
    blueskyUrl: row.bluesky_url || row.blueskyUrl || "",
    photoUrl: row.photo_url || row.photoUrl || "",
    photoKey: row.photo_key || row.photoKey || "",
    notes: cleanText(row.notes || ""),
    status: row.status || "pending",
    reviewedBy: row.reviewed_by || row.reviewedBy || "",
    reviewedAt: row.reviewed_at || row.reviewedAt || "",
    createdAt: row.created_at || row.createdAt || "",
  };
}

function hasSuggestedUpdate(data = {}) {
  return Boolean(
    data.websiteUrl ||
    data.substackUrl ||
    data.instagramUrl ||
    data.facebookUrl ||
    data.tiktokUrl ||
    data.xUrl ||
    data.blueskyUrl ||
    data.photoUrl ||
    data.notes,
  );
}

function normalizeUrl(value = "") {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "";
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  return `https://${cleaned}`;
}

function normalizeSocialUrl(value = "", platform = "") {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "";
  if (/^https?:\/\//i.test(cleaned)) return cleaned;

  const handle = cleaned.replace(/^@+/, "").replace(/^\/+/, "");
  if (platform === "substack") {
    if (handle.includes(".")) return `https://${handle}`;
    return `https://substack.com/@${handle}`;
  }

  const bases = {
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/",
    tiktok: "https://www.tiktok.com/@",
    x: "https://x.com/",
    bluesky: "https://bsky.app/profile/",
  };
  return bases[platform] ? `${bases[platform]}${handle}` : normalizeUrl(cleaned);
}

async function ensureColumn(db, table, column, definition) {
  const info = await db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = (info.results || []).some((row) => row.name === column);
  if (!exists) await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
}

function publicPhotoUrl(key = "") {
  const base =
    stringBinding(env.PHOTO_PUBLIC_BASE) ||
    stringBinding(env.PHOTOS_PUBLIC_BASE) ||
    "https://photos.nhdeservesbetter.com";
  return `${base.replace(/\/+$/, "")}/${encodeAssetKey(key)}`;
}

function stringBinding(binding) {
  return typeof binding === "string" ? binding.trim() : "";
}

function encodeAssetKey(key = "") {
  return key.split("/").map((part) => encodeURIComponent(part)).join("/");
}

function sanitizeFilename(value = "") {
  return String(value)
    .trim()
    .replace(/[/\\]/g, "-")
    .replace(/[^a-zA-Z0-9._ -]+/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

function contentTypeFor(key = "") {
  const extension = key.split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  if (extension === "avif") return "image/avif";
  return "image/jpeg";
}

function slugify(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function numericId(value = "") {
  const match = String(value || "").match(/\d+/);
  return match ? Number(match[0]) : null;
}
