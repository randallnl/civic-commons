import { env } from "cloudflare:workers";
import { cleanText } from "./text";

const TABLE_SQL = `CREATE TABLE IF NOT EXISTS community_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_key TEXT NOT NULL,
  entity_name TEXT,
  page_url TEXT,
  display_name TEXT,
  email TEXT,
  comment TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export function communityUpdatesDb() {
  return env.d1_db;
}

export async function ensureCommunityUpdatesTable(db = communityUpdatesDb()) {
  if (!db) throw new Error("D1 database binding is not configured.");
  await db.prepare(TABLE_SQL).run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_community_updates_entity_status
       ON community_updates(entity_type, entity_key, status, created_at)`,
    )
    .run();
}

export async function getApprovedCommunityUpdates(entityType, entityKey, { limit = 12 } = {}) {
  const db = communityUpdatesDb();
  if (!db || !entityType || !entityKey) return [];

  await ensureCommunityUpdatesTable(db);

  const result = await db
    .prepare(
      `SELECT id, entity_type, entity_key, entity_name, page_url, display_name,
              comment, photo_url, created_at
       FROM community_updates
       WHERE entity_type = ?
         AND entity_key = ?
         AND status = 'approved'
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .bind(entityType, String(entityKey), limit)
    .all();

  return (result.results || []).map(normalizeUpdate);
}

export async function getPendingCommunityUpdates({ limit = 25 } = {}) {
  const db = communityUpdatesDb();
  if (!db) return [];

  await ensureCommunityUpdatesTable(db);

  const result = await db
    .prepare(
      `SELECT id, entity_type, entity_key, entity_name, page_url, display_name,
              email, comment, photo_url, status, created_at
       FROM community_updates
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT ?`,
    )
    .bind(limit)
    .all();

  return (result.results || []).map(normalizeUpdate);
}

export function communityUpdateEntityKey(value = "") {
  return String(value || "").trim();
}

export function normalizeUpdate(update = {}) {
  return {
    ...update,
    entityType: update.entity_type || update.entityType,
    entityKey: update.entity_key || update.entityKey,
    entityName: cleanText(update.entity_name || update.entityName || ""),
    pageUrl: update.page_url || update.pageUrl || "",
    displayName: cleanText(update.display_name || update.displayName || "Community member"),
    comment: cleanText(update.comment || ""),
    photoUrl: update.photo_url || update.photoUrl || "",
    createdAt: update.created_at || update.createdAt || "",
  };
}

export function communityUpdateDate(value = "") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return cleanText(value);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
