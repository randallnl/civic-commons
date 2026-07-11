import { adminDb } from "./adminAuth";

const PROFILE_EDIT_TABLE = "admin_profile_edits";

export async function ensureProfileEditTables(db = adminDb()) {
  if (!db) throw new Error("D1 database binding is not configured.");

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS ${PROFILE_EDIT_TABLE} (
        entity_type TEXT NOT NULL,
        entity_key TEXT NOT NULL,
        display_name TEXT,
        data_json TEXT NOT NULL,
        updated_by TEXT,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (entity_type, entity_key)
      )`,
    )
    .run();

  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_admin_profile_edits_type
       ON ${PROFILE_EDIT_TABLE}(entity_type, updated_at)`,
    )
    .run();
}

export async function getProfileEdit(entityType, entityKey, db = adminDb()) {
  if (!db || !entityType || !entityKey) return null;
  await ensureProfileEditTables(db);

  const row = await db
    .prepare(
      `SELECT entity_type, entity_key, display_name, data_json, updated_by, updated_at
       FROM ${PROFILE_EDIT_TABLE}
       WHERE entity_type = ? AND entity_key = ?
       LIMIT 1`,
    )
    .bind(entityType, String(entityKey))
    .first();

  if (!row) return null;

  return {
    ...row,
    data: parseJson(row.data_json),
  };
}

export async function saveProfileEdit({
  entityType,
  entityKey,
  displayName = "",
  data = {},
  updatedBy = "",
  db = adminDb(),
}) {
  if (!db) throw new Error("D1 database binding is not configured.");
  if (!entityType) throw new Error("Profile type is required.");
  if (!entityKey) throw new Error("Profile identifier is required.");

  await ensureProfileEditTables(db);

  const json = JSON.stringify(data || {});
  await db
    .prepare(
      `INSERT INTO ${PROFILE_EDIT_TABLE}
        (entity_type, entity_key, display_name, data_json, updated_by, updated_at, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
       ON CONFLICT(entity_type, entity_key) DO UPDATE SET
        display_name = excluded.display_name,
        data_json = excluded.data_json,
        updated_by = excluded.updated_by,
        updated_at = datetime('now')`,
    )
    .bind(entityType, String(entityKey), displayName, json, updatedBy)
    .run();
}

export function applyProfileEdit(record, edit) {
  if (!record || !edit?.data) return record;

  return {
    ...record,
    ...edit.data,
    adminEdit: {
      updatedAt: edit.updated_at,
      updatedBy: edit.updated_by,
    },
  };
}

export function parseJson(value) {
  if (!value) return {};

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

export function slugifyProfile(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
