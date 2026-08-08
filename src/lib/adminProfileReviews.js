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

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS admin_profile_review_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_key TEXT NOT NULL,
        assigned_to TEXT,
        assigned_by TEXT,
        assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        assignment_note TEXT,
        UNIQUE(entity_type, entity_key)
      )`,
    )
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_admin_profile_review_assignments_profile
       ON admin_profile_review_assignments(entity_type, entity_key)`,
    )
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_admin_profile_review_assignments_assigned
       ON admin_profile_review_assignments(assigned_to, assigned_at)`,
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
  const [reviewResult, assignmentResult] = await Promise.all([
    db
    .prepare(
      `SELECT entity_type, entity_key, review_note, reviewed_by, reviewed_at
       FROM admin_profile_reviews`,
    )
      .all(),
    db
      .prepare(
        `SELECT entity_type, entity_key, assigned_to, assigned_by, assigned_at, assignment_note
         FROM admin_profile_review_assignments`,
      )
      .all(),
  ]);

  const reviews = new Map();
  for (const row of reviewResult.results || []) {
    reviews.set(profileReviewKey(row.entity_type, row.entity_key), {
      note: row.review_note || "",
      reviewedBy: row.reviewed_by || "",
      reviewedAt: row.reviewed_at || "",
      isRecent: isRecentReview(row.reviewed_at),
    });
  }

  for (const row of assignmentResult.results || []) {
    const key = profileReviewKey(row.entity_type, row.entity_key);
    const review = reviews.get(key) || {
      note: "",
      reviewedBy: "",
      reviewedAt: "",
      isRecent: false,
    };
    reviews.set(key, {
      ...review,
      assignedTo: normalizeEmail(row.assigned_to),
      assignedBy: normalizeEmail(row.assigned_by),
      assignedAt: row.assigned_at || "",
      assignmentNote: row.assignment_note || "",
    });
  }

  return reviews;
}

export async function assignProfileReview({
  entityType,
  entityKey,
  assignedTo = "",
  assignedBy = "",
  assignmentNote = "",
  db = adminDb(),
} = {}) {
  if (!db) throw new Error("D1 database binding is not configured.");
  const normalizedType = normalizeReviewEntityType(entityType);
  const normalizedKey = String(entityKey || "").trim();
  const normalizedAssignedTo = normalizeEmail(assignedTo);
  if (!normalizedType || !normalizedKey) {
    throw new Error("Choose a candidate or legislator profile to assign.");
  }

  await ensureAdminProfileReviewTable(db);

  if (!normalizedAssignedTo) {
    const result = await db
      .prepare(
        `DELETE FROM admin_profile_review_assignments
         WHERE entity_type = ?
           AND entity_key = ?`,
      )
      .bind(normalizedType, normalizedKey)
      .run();
    return { changed: result.meta?.changes ?? result.changes ?? 0, assignedTo: "" };
  }

  const result = await db
    .prepare(
      `INSERT INTO admin_profile_review_assignments (
         entity_type, entity_key, assigned_to, assigned_by, assigned_at, assignment_note
       )
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
       ON CONFLICT(entity_type, entity_key) DO UPDATE SET
         assigned_to = excluded.assigned_to,
         assigned_by = excluded.assigned_by,
         assigned_at = CURRENT_TIMESTAMP,
         assignment_note = excluded.assignment_note`,
    )
    .bind(
      normalizedType,
      normalizedKey,
      normalizedAssignedTo,
      normalizeEmail(assignedBy),
      String(assignmentNote || "").trim(),
    )
    .run();

  return {
    changed: result.meta?.changes ?? result.changes ?? 0,
    assignedTo: normalizedAssignedTo,
  };
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

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}
