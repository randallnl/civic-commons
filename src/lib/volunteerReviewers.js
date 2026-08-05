import { env } from "cloudflare:workers";
import { cleanText } from "./text";

export const REVIEWER_ROLES = [
  "volunteer",
  "profile_reviewer",
  "content_moderator",
  "org_editor",
  "super_admin",
];

export const REVIEWER_STATUSES = [
  "pending",
  "approved",
  "disabled",
  "rejected",
];

export function volunteerReviewersDb() {
  return env.d1_db;
}

export async function ensureVolunteerReviewerTables(db = volunteerReviewersDb()) {
  if (!db) throw new Error("D1 database binding is not configured.");

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS volunteer_reviewers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        role TEXT NOT NULL DEFAULT 'volunteer',
        status TEXT NOT NULL DEFAULT 'pending',
        interests TEXT,
        experience TEXT,
        availability TEXT,
        notes TEXT,
        reviewed_by TEXT,
        reviewed_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    )
    .run();

  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_volunteer_reviewers_status_role
       ON volunteer_reviewers(status, role, created_at)`,
    )
    .run();
}

export async function submitVolunteerReviewerApplication(data = {}, db = volunteerReviewersDb()) {
  if (!db) throw new Error("D1 database binding is not configured.");
  await ensureVolunteerReviewerTables(db);

  const email = normalizeEmail(data.email);
  const name = cleanText(data.name || "");
  if (!email) throw new Error("Email is required.");
  if (!name) throw new Error("Name is required.");

  const result = await db
    .prepare(
      `INSERT INTO volunteer_reviewers (
         email, name, role, status, interests, experience, availability, notes,
         updated_at
       )
       VALUES (?, ?, 'volunteer', 'pending', ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(email) DO UPDATE SET
         name = excluded.name,
         status = CASE
           WHEN volunteer_reviewers.status = 'approved' THEN volunteer_reviewers.status
           ELSE 'pending'
         END,
         interests = excluded.interests,
         experience = excluded.experience,
         availability = excluded.availability,
         notes = COALESCE(NULLIF(excluded.notes, ''), volunteer_reviewers.notes),
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      email,
      name,
      cleanText(data.interests || ""),
      cleanText(data.experience || ""),
      cleanText(data.availability || ""),
      cleanText(data.notes || ""),
    )
    .run();

  return { changed: result.meta?.changes ?? result.changes ?? 0, email };
}

export async function getVolunteerReviewerByEmail(email, db = volunteerReviewersDb()) {
  if (!db) return null;
  await ensureVolunteerReviewerTables(db);

  const reviewer = await db
    .prepare(
      `SELECT *
       FROM volunteer_reviewers
       WHERE email = ?
       LIMIT 1`,
    )
    .bind(normalizeEmail(email))
    .first();

  return reviewer ? normalizeReviewer(reviewer) : null;
}

export async function getVolunteerReviewers({
  status = "",
  role = "",
  limit = 200,
  db = volunteerReviewersDb(),
} = {}) {
  if (!db) return [];
  await ensureVolunteerReviewerTables(db);

  const normalizedStatus = REVIEWER_STATUSES.includes(status) ? status : "";
  const normalizedRole = REVIEWER_ROLES.includes(role) ? role : "";
  const result = await db
    .prepare(
      `SELECT *
       FROM volunteer_reviewers
       WHERE (? = '' OR status = ?)
         AND (? = '' OR role = ?)
       ORDER BY
         CASE status
           WHEN 'pending' THEN 0
           WHEN 'approved' THEN 1
           WHEN 'disabled' THEN 2
           ELSE 3
         END,
         created_at DESC
       LIMIT ?`,
    )
    .bind(normalizedStatus, normalizedStatus, normalizedRole, normalizedRole, Number(limit) || 200)
    .all();

  return (result.results || []).map(normalizeReviewer);
}

export async function reviewerCounts(db = volunteerReviewersDb()) {
  if (!db) return emptyCounts();
  await ensureVolunteerReviewerTables(db);

  const result = await db
    .prepare(
      `SELECT status, COUNT(*) AS count
       FROM volunteer_reviewers
       GROUP BY status`,
    )
    .all();

  const counts = emptyCounts();
  for (const row of result.results || []) {
    const status = REVIEWER_STATUSES.includes(row.status) ? row.status : "pending";
    counts[status] = Number(row.count || 0);
    counts.total += Number(row.count || 0);
  }
  return counts;
}

export async function updateVolunteerReviewer({
  id,
  email = "",
  role = "volunteer",
  status = "pending",
  notes = "",
  reviewedBy = "",
  db = volunteerReviewersDb(),
} = {}) {
  if (!db) throw new Error("D1 database binding is not configured.");
  await ensureVolunteerReviewerTables(db);

  const normalizedRole = REVIEWER_ROLES.includes(role) ? role : "volunteer";
  const normalizedStatus = REVIEWER_STATUSES.includes(status) ? status : "pending";
  const clauses = [];
  const params = [];

  if (Number(id)) {
    clauses.push("id = ?");
    params.push(Number(id));
  }
  if (normalizeEmail(email)) {
    clauses.push("email = ?");
    params.push(normalizeEmail(email));
  }
  if (!clauses.length) throw new Error("Reviewer id or email is required.");

  if (!Number(id) && normalizeEmail(email)) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO volunteer_reviewers (
           email, name, role, status, notes, reviewed_by, reviewed_at, updated_at
         )
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      )
      .bind(
        normalizeEmail(email),
        normalizeEmail(email),
        normalizedRole,
        normalizedStatus,
        cleanText(notes),
        normalizeEmail(reviewedBy),
      )
      .run();
  }

  const result = await db
    .prepare(
      `UPDATE volunteer_reviewers
       SET role = ?,
           status = ?,
           notes = ?,
           reviewed_by = ?,
           reviewed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE ${clauses.join(" OR ")}`,
    )
    .bind(
      normalizedRole,
      normalizedStatus,
      cleanText(notes),
      normalizeEmail(reviewedBy),
      ...params,
    )
    .run();

  const changed = result.meta?.changes ?? result.changes ?? 0;
  if (!changed) throw new Error("No matching reviewer account was updated.");
  return { changed };
}

export function reviewerRoleLabel(role = "") {
  const value = String(role || "volunteer");
  if (value === "super_admin") return "Super Admin";
  if (value === "profile_reviewer") return "Profile Reviewer";
  if (value === "content_moderator") return "Content Moderator";
  if (value === "org_editor") return "Organization Editor";
  return "Volunteer Reviewer";
}

export function reviewerStatusLabel(status = "") {
  const value = String(status || "pending").trim().toLowerCase();
  if (value === "approved") return "Approved";
  if (value === "disabled") return "Disabled";
  if (value === "rejected") return "Rejected";
  return "Pending";
}

export function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function normalizeReviewer(row = {}) {
  return {
    id: row.id,
    email: normalizeEmail(row.email),
    name: cleanText(row.name),
    role: REVIEWER_ROLES.includes(row.role) ? row.role : "volunteer",
    status: REVIEWER_STATUSES.includes(row.status) ? row.status : "pending",
    interests: cleanText(row.interests),
    experience: cleanText(row.experience),
    availability: cleanText(row.availability),
    notes: cleanText(row.notes),
    reviewedBy: normalizeEmail(row.reviewed_by),
    reviewedAt: row.reviewed_at || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function emptyCounts() {
  return {
    total: 0,
    pending: 0,
    approved: 0,
    disabled: 0,
    rejected: 0,
  };
}
