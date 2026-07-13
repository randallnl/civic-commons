import { adminDb } from "./adminAuth";

export const RECENT_REVIEW_DAYS = 30;

export async function ensureAdminProfileReviewTable(db = adminDb()) {
  if (!db) return;

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS admin_profile_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_key TEXT NOT NULL,
        review_note TEXT,
        reviewed_by TEXT,
        reviewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(entity_type, entity_key)
      )`,
    )
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_admin_profile_reviews_profile
       ON admin_profile_reviews(entity_type, entity_key)`,
    )
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_admin_profile_reviews_reviewed_at
       ON admin_profile_reviews(reviewed_at)`,
    )
    .run();
}

export async function markProfileReviewed({
  entityType,
  entityKey,
  reviewedBy = "",
  reviewNote = "",
  db = adminDb(),
} = {}) {
  if (!db) throw new Error("D1 database binding is not configured.");
  const normalizedType = normalizeReviewEntityType(entityType);
  const normalizedKey = String(entityKey || "").trim();
  if (!normalizedType || !normalizedKey) {
    throw new Error("Choose a candidate or legislator profile to review.");
  }

  await ensureAdminProfileReviewTable(db);
  const result = await db
    .prepare(
      `INSERT INTO admin_profile_reviews (
         entity_type, entity_key, review_note, reviewed_by, reviewed_at
       )
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(entity_type, entity_key) DO UPDATE SET
         review_note = excluded.review_note,
         reviewed_by = excluded.reviewed_by,
         reviewed_at = CURRENT_TIMESTAMP`,
    )
    .bind(normalizedType, normalizedKey, reviewNote, reviewedBy)
    .run();

  return { changed: result.meta?.changes ?? result.changes ?? 0 };
}

export async function profileReviewMap(db = adminDb()) {
  if (!db) return new Map();
  await ensureAdminProfileReviewTable(db);
  const result = await db
    .prepare(
      `SELECT entity_type, entity_key, review_note, reviewed_by, reviewed_at
       FROM admin_profile_reviews`,
    )
    .all();

  return new Map(
    (result.results || []).map((row) => [
      profileReviewKey(row.entity_type, row.entity_key),
      {
        note: row.review_note || "",
        reviewedBy: row.reviewed_by || "",
        reviewedAt: row.reviewed_at || "",
        isRecent: isRecentReview(row.reviewed_at),
      },
    ]),
  );
}

export function profileReviewKey(entityType = "", entityKey = "") {
  return `${normalizeReviewEntityType(entityType)}:${String(entityKey || "").trim()}`;
}

export function normalizeReviewEntityType(value = "") {
  const text = String(value || "").trim().toLowerCase();
  if (text === "representative" || text === "legislator" || text === "person") {
    return "representative";
  }
  if (text === "candidate") return "candidate";
  return "";
}

function isRecentReview(value = "") {
  const reviewedAt = new Date(String(value || ""));
  if (Number.isNaN(reviewedAt.getTime())) return false;
  const cutoff = Date.now() - RECENT_REVIEW_DAYS * 24 * 60 * 60 * 1000;
  return reviewedAt.getTime() >= cutoff;
}
