import { env } from "cloudflare:workers";
import { ensureWorkflowColumns, normalizeWorkflowFields } from "./adminWorkflow";
import { cleanText } from "./text";

const TABLE_SQL = `CREATE TABLE IF NOT EXISTS suggested_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_url TEXT NOT NULL,
  submitter_email TEXT,
  suggestion TEXT NOT NULL,
  other_info TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TEXT,
  response_status TEXT,
  response_note TEXT,
  response_sent_at TEXT,
  received_sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export function suggestedUpdatesDb() {
  return env.d1_db;
}

export async function ensureSuggestedUpdatesTable(db = suggestedUpdatesDb()) {
  if (!db) throw new Error("D1 database binding is not configured.");
  await db.prepare(TABLE_SQL).run();
  await addColumnIfMissing(db, "suggested_updates", "submitter_email", "TEXT");
  await addColumnIfMissing(db, "suggested_updates", "other_info", "TEXT");
  await addColumnIfMissing(db, "suggested_updates", "response_status", "TEXT");
  await addColumnIfMissing(db, "suggested_updates", "response_note", "TEXT");
  await addColumnIfMissing(db, "suggested_updates", "response_sent_at", "TEXT");
  await addColumnIfMissing(db, "suggested_updates", "received_sent_at", "TEXT");
  await ensureWorkflowColumns(db, "suggested_updates");
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_suggested_updates_status
       ON suggested_updates(status, created_at)`,
    )
    .run();
}

export async function createSuggestedUpdate({
  pageUrl,
  submitterEmail = "",
  suggestion,
  otherInfo = "",
  db = suggestedUpdatesDb(),
} = {}) {
  if (!db) throw new Error("D1 database binding is not configured.");
  await ensureSuggestedUpdatesTable(db);

  const normalized = {
    pageUrl: cleanText(pageUrl),
    submitterEmail: cleanText(submitterEmail),
    suggestion: cleanText(suggestion),
    otherInfo: cleanText(otherInfo),
  };
  const duplicate = await db
    .prepare(
      `SELECT id, received_sent_at
       FROM suggested_updates
       WHERE COALESCE(page_url, '') = ?
         AND COALESCE(submitter_email, '') = ?
         AND COALESCE(suggestion, '') = ?
         AND COALESCE(other_info, '') = ?
         AND created_at >= datetime('now', '-10 minutes')
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .bind(
      normalized.pageUrl,
      normalized.submitterEmail,
      normalized.suggestion,
      normalized.otherInfo,
    )
    .first();

  if (duplicate?.id) {
    return {
      id: duplicate.id,
      duplicate: true,
      receivedSentAt: duplicate.received_sent_at || "",
    };
  }

  const result = await db
    .prepare(
      `INSERT INTO suggested_updates (
        page_url, submitter_email, suggestion, other_info, status, created_at
      )
      VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
    )
    .bind(
      normalized.pageUrl,
      normalized.submitterEmail,
      normalized.suggestion,
      normalized.otherInfo,
    )
    .run();

  return {
    id: result.meta?.last_row_id || result.meta?.lastRowId || result.lastRowId,
    duplicate: false,
    receivedSentAt: "",
  };
}

export async function claimSuggestedUpdateReceivedEmail(updateId, db = suggestedUpdatesDb()) {
  if (!db || !updateId) return false;
  await ensureSuggestedUpdatesTable(db);

  const result = await db
    .prepare(
      `UPDATE suggested_updates
       SET received_sent_at = CURRENT_TIMESTAMP
       WHERE id = ?
         AND received_sent_at IS NULL`,
    )
    .bind(updateId)
    .run();

  const changed = result.meta?.changes ?? result.changes ?? 0;
  return changed > 0;
}

export async function getPendingSuggestedUpdates({ limit = 50 } = {}) {
  const db = suggestedUpdatesDb();
  if (!db) return [];
  await ensureSuggestedUpdatesTable(db);

  const result = await db
    .prepare(
      `SELECT id, page_url, submitter_email, suggestion, other_info, status,
              reviewed_by, reviewed_at, response_status, response_note,
              response_sent_at, received_sent_at, workflow_status, assigned_to,
              moderator_note, workflow_updated_at, created_at
       FROM suggested_updates
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT ?`,
    )
    .bind(limit)
    .all();

  return (result.results || []).map(normalizeSuggestedUpdate);
}

export async function countPendingSuggestedUpdates(db = suggestedUpdatesDb()) {
  if (!db) return 0;
  await ensureSuggestedUpdatesTable(db);

  const row = await db
    .prepare("SELECT COUNT(*) AS count FROM suggested_updates WHERE status = 'pending'")
    .first();

  return Number(row?.count || 0);
}

export function normalizeSuggestedUpdate(row = {}) {
  return {
    id: row.id,
    pageUrl: row.page_url || row.pageUrl || "",
    submitterEmail: cleanText(row.submitter_email || row.submitterEmail || ""),
    suggestion: cleanText(row.suggestion || ""),
    otherInfo: cleanText(row.other_info || row.otherInfo || ""),
    status: row.status || "pending",
    reviewedBy: cleanText(row.reviewed_by || row.reviewedBy || ""),
    reviewedAt: row.reviewed_at || row.reviewedAt || "",
    responseStatus: row.response_status || row.responseStatus || "",
    responseNote: cleanText(row.response_note || row.responseNote || ""),
    responseSentAt: row.response_sent_at || row.responseSentAt || "",
    receivedSentAt: row.received_sent_at || row.receivedSentAt || "",
    createdAt: row.created_at || row.createdAt || "",
    ...normalizeWorkflowFields(row),
  };
}

export function suggestedUpdateDate(value = "") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

async function addColumnIfMissing(db, table, column, definition) {
  const result = await db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = (result.results || []).some((row) => row.name === column);
  if (exists) return;
  await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
}
