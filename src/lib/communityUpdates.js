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
  link_url TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const MENTIONS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS community_update_mentions (
  update_id INTEGER NOT NULL,
  personid INTEGER NOT NULL,
  person_id INTEGER,
  employeeno INTEGER,
  filer_entity_number TEXT,
  name TEXT NOT NULL,
  chamber TEXT,
  party TEXT,
  district TEXT,
  path TEXT,
  role_label TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(update_id, personid)
)`;

export function communityUpdatesDb() {
  return env.d1_db;
}

export async function ensureCommunityUpdatesTable(db = communityUpdatesDb()) {
  if (!db) throw new Error("D1 database binding is not configured.");
  await db.prepare(TABLE_SQL).run();
  await db.prepare(MENTIONS_TABLE_SQL).run();
  await addColumnIfMissing(db, "community_updates", "link_url", "TEXT");
  await addColumnIfMissing(db, "community_update_mentions", "person_id", "INTEGER");
  await addColumnIfMissing(db, "community_update_mentions", "filer_entity_number", "TEXT");
  await addColumnIfMissing(db, "community_update_mentions", "path", "TEXT");
  await addColumnIfMissing(db, "community_update_mentions", "role_label", "TEXT");
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_community_updates_entity_status
       ON community_updates(entity_type, entity_key, status, created_at)`,
    )
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_community_update_mentions_update
       ON community_update_mentions(update_id)`,
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
              comment, link_url, photo_url, created_at
       FROM community_updates
       WHERE entity_type = ?
         AND entity_key = ?
         AND status = 'approved'
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .bind(entityType, String(entityKey), limit)
    .all();

  return hydrateUpdateMentions((result.results || []).map(normalizeUpdate), db);
}

export async function getRecentApprovedCommunityUpdates({ limit = 6 } = {}) {
  const db = communityUpdatesDb();
  if (!db) return [];

  await ensureCommunityUpdatesTable(db);

  const result = await db
    .prepare(
      `SELECT id, entity_type, entity_key, entity_name, page_url, display_name,
              comment, link_url, photo_url, created_at
       FROM community_updates
       WHERE status = 'approved'
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .bind(limit)
    .all();

  return hydrateUpdateMentions((result.results || []).map(normalizeUpdate), db);
}

export async function getPendingCommunityUpdates({ limit = 25 } = {}) {
  const db = communityUpdatesDb();
  if (!db) return [];

  await ensureCommunityUpdatesTable(db);

  const result = await db
    .prepare(
      `SELECT id, entity_type, entity_key, entity_name, page_url, display_name,
              email, comment, link_url, photo_url, status, created_at
       FROM community_updates
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT ?`,
    )
    .bind(limit)
    .all();

  return hydrateUpdateMentions((result.results || []).map(normalizeUpdate), db);
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
    linkUrl: update.link_url || update.linkUrl || "",
    photoUrl: update.photo_url || update.photoUrl || "",
    mentions: Array.isArray(update.mentions) ? update.mentions : [],
    createdAt: update.created_at || update.createdAt || "",
  };
}

export async function saveCommunityUpdateMentions(updateId, comment = "", db = communityUpdatesDb()) {
  if (!db || !updateId || !comment) return [];

  await ensureCommunityUpdatesTable(db);
  const mentions = await findPeopleMentions(comment, db);

  if (!mentions.length) return [];

  const statements = mentions.map((mention) =>
    db
      .prepare(
        `INSERT OR IGNORE INTO community_update_mentions (
          update_id, personid, person_id, employeeno, filer_entity_number,
          name, chamber, party, district, path, role_label
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        updateId,
        mention.personid,
        mention.personId || null,
        mention.employeeno || null,
        mention.filerEntityNumber || "",
        mention.name,
        mention.chamber,
        mention.party || "",
        mention.district || "",
        mention.path || "",
        mention.roleLabel || "",
      ),
  );

  await db.batch(statements);
  return mentions;
}

async function findPeopleMentions(comment = "", db) {
  const cleanComment = cleanText(comment);
  if (!cleanComment.includes("@")) return [];

  const result = await db
    .prepare(
      `SELECT id, gc_personid, employeeno, filer_entity_number, slug,
              firstname, lastname, display_name, party,
              is_current_legislator, is_2026_candidate
       FROM d1_people
       WHERE is_current_legislator = 1
          OR is_2026_candidate = 1
       ORDER BY lastname COLLATE NOCASE, firstname COLLATE NOCASE, display_name COLLATE NOCASE`,
    )
    .all();

  const mentions = [];
  const seen = new Set();

  for (const person of result.results || []) {
    const name = cleanText(
      person.display_name ||
        [person.firstname, person.lastname].filter(Boolean).join(" "),
    );
    if (!name || !hasMention(cleanComment, name)) continue;
    const mentionKey = Number(person.gc_personid || person.id);
    if (!mentionKey || seen.has(mentionKey)) continue;

    seen.add(mentionKey);
    mentions.push({
      personid: mentionKey,
      personId: person.id,
      employeeno: person.employeeno,
      filerEntityNumber: person.filer_entity_number || "",
      name,
      chamber: Number(person.is_current_legislator) === 1 ? "Legislator" : "",
      party: person.party || "",
      district: "",
      path: personMentionPath(person),
      roleLabel: personRoleLabel(person),
    });
  }

  return mentions;
}

function personMentionPath(person = {}) {
  if (Number(person.is_current_legislator) === 1) {
    return `/people/${encodeURIComponent(String(person.slug || person.gc_personid || person.employeeno || person.id))}`;
  }

  if (Number(person.is_2026_candidate) === 1) {
    return `/candidates/${encodeURIComponent(String(person.filer_entity_number || person.slug || person.id))}`;
  }

  return "";
}

function personRoleLabel(person = {}) {
  const labels = [
    Number(person.is_current_legislator) === 1 && "Legislator",
    Number(person.is_2026_candidate) === 1 && "Candidate",
  ].filter(Boolean);
  return labels.join(" · ");
}

function hasMention(comment = "", name = "") {
  return new RegExp(
    `(^|\\s)@${escapeRegExp(name)}(?=$|\\s|[.,!?;:])`,
    "i",
  ).test(comment);
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function hydrateUpdateMentions(updates = [], db = communityUpdatesDb()) {
  if (!updates.length || !db) return updates;
  const ids = updates.map((update) => update.id).filter(Boolean);
  if (!ids.length) return updates;

  const result = await db
    .prepare(
      `SELECT update_id, personid, person_id, employeeno, filer_entity_number,
              name, chamber, party, district, path, role_label
       FROM community_update_mentions
       WHERE update_id IN (${ids.map(() => "?").join(", ")})
       ORDER BY name`,
    )
    .bind(...ids)
    .all();
  const mentionsByUpdate = new Map();

  for (const mention of result.results || []) {
    const list = mentionsByUpdate.get(mention.update_id) || [];
    list.push({
      personid: mention.personid,
      personId: mention.person_id,
      employeeno: mention.employeeno,
      filerEntityNumber: mention.filer_entity_number,
      name: cleanText(mention.name),
      chamber: cleanText(mention.chamber),
      party: cleanText(mention.party),
      district: cleanText(mention.district),
      path: mention.path || `/people/${encodeURIComponent(String(mention.personid))}`,
      roleLabel: cleanText(mention.role_label),
    });
    mentionsByUpdate.set(mention.update_id, list);
  }

  return updates.map((update) => ({
    ...update,
    mentions: mentionsByUpdate.get(update.id) || [],
  }));
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

async function addColumnIfMissing(db, table, column, definition) {
  const columns = await db.prepare(`PRAGMA table_info(${table})`).all();
  const hasColumn = (columns.results || []).some((row) => row.name === column);
  if (hasColumn) return;

  await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
}
