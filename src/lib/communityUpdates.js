import { env } from "cloudflare:workers";
import { ensureWorkflowColumns, normalizeWorkflowFields } from "./adminWorkflow";
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
  response_status TEXT,
  response_note TEXT,
  response_sent_at TEXT,
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

const PHOTOS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS community_update_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  update_id INTEGER NOT NULL,
  photo_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export function communityUpdatesDb() {
  return env.d1_db;
}

export async function ensureCommunityUpdatesTable(db = communityUpdatesDb()) {
  if (!db) throw new Error("D1 database binding is not configured.");
  await db.prepare(TABLE_SQL).run();
  await db.prepare(MENTIONS_TABLE_SQL).run();
  await db.prepare(PHOTOS_TABLE_SQL).run();
  await addColumnIfMissing(db, "community_updates", "link_url", "TEXT");
  await addColumnIfMissing(db, "community_updates", "response_status", "TEXT");
  await addColumnIfMissing(db, "community_updates", "response_note", "TEXT");
  await addColumnIfMissing(db, "community_updates", "response_sent_at", "TEXT");
  await addColumnIfMissing(db, "community_update_mentions", "person_id", "INTEGER");
  await addColumnIfMissing(db, "community_update_mentions", "filer_entity_number", "TEXT");
  await addColumnIfMissing(db, "community_update_mentions", "path", "TEXT");
  await addColumnIfMissing(db, "community_update_mentions", "role_label", "TEXT");
  await ensureWorkflowColumns(db, "community_updates");
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
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_community_update_photos_update
       ON community_update_photos(update_id, sort_order)`,
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

  return hydrateUpdatePhotosAndMentions((result.results || []).map(normalizeUpdate), db);
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

  return hydrateUpdatePhotosAndMentions((result.results || []).map(normalizeUpdate), db);
}

export async function getPendingCommunityUpdates({ limit = 25 } = {}) {
  const db = communityUpdatesDb();
  if (!db) return [];

  await ensureCommunityUpdatesTable(db);

  const result = await db
    .prepare(
      `SELECT id, entity_type, entity_key, entity_name, page_url, display_name,
              email, comment, link_url, photo_url, status, workflow_status,
              assigned_to, moderator_note, workflow_updated_at, response_status,
              response_note, response_sent_at, created_at
       FROM community_updates
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT ?`,
    )
    .bind(limit)
    .all();

  return hydrateUpdatePhotosAndMentions((result.results || []).map(normalizeUpdate), db);
}

export async function countPendingCommunityUpdates(db = communityUpdatesDb()) {
  if (!db) return 0;
  await ensureCommunityUpdatesTable(db);

  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM community_updates
       WHERE status = 'pending'`,
    )
    .first();

  return Number(row?.count || 0);
}

export function communityUpdateEntityKey(value = "") {
  return String(value || "").trim();
}

export function normalizeUpdate(update = {}) {
  const photoUrls = Array.isArray(update.photoUrls)
    ? update.photoUrls.filter(Boolean)
    : [];
  const primaryPhoto = update.photo_url || update.photoUrl || photoUrls[0] || "";

  return {
    ...update,
    entityType: update.entity_type || update.entityType,
    entityKey: update.entity_key || update.entityKey,
    entityName: cleanText(update.entity_name || update.entityName || ""),
    pageUrl: update.page_url || update.pageUrl || "",
    displayName: cleanText(update.display_name || update.displayName || "Community member"),
    comment: cleanText(update.comment || ""),
    linkUrl: update.link_url || update.linkUrl || "",
    photoUrl: primaryPhoto,
    photoUrls: photoUrls.length ? photoUrls : primaryPhoto ? [primaryPhoto] : [],
    mentions: Array.isArray(update.mentions) ? update.mentions : [],
    responseStatus: update.response_status || update.responseStatus || "",
    responseNote: cleanText(update.response_note || update.responseNote || ""),
    responseSentAt: update.response_sent_at || update.responseSentAt || "",
    createdAt: update.created_at || update.createdAt || "",
    ...normalizeWorkflowFields(update),
  };
}

export async function saveCommunityUpdatePhotos(updateId, photoUrls = [], db = communityUpdatesDb()) {
  const urls = photoUrls.map((url) => String(url || "").trim()).filter(Boolean);
  if (!db || !updateId || !urls.length) return [];

  await ensureCommunityUpdatesTable(db);
  const statements = urls.map((url, index) =>
    db
      .prepare(
        `INSERT INTO community_update_photos (update_id, photo_url, sort_order)
         VALUES (?, ?, ?)`,
      )
      .bind(updateId, url, index),
  );

  await db.batch(statements);
  return urls;
}

export async function replaceCommunityUpdatePhotos(updateId, photoUrls = [], db = communityUpdatesDb()) {
  if (!db || !updateId) return [];

  const urls = [...new Set(
    photoUrls.map((url) => String(url || "").trim()).filter(Boolean),
  )];

  await ensureCommunityUpdatesTable(db);
  const statements = [
    db
      .prepare("UPDATE community_updates SET photo_url = ? WHERE id = ?")
      .bind(urls[0] || "", updateId),
    db
      .prepare("DELETE FROM community_update_photos WHERE update_id = ?")
      .bind(updateId),
    ...urls.map((url, index) =>
      db
        .prepare(
          `INSERT INTO community_update_photos (update_id, photo_url, sort_order)
           VALUES (?, ?, ?)`,
        )
        .bind(updateId, url, index),
    ),
  ];

  await db.batch(statements);
  return urls;
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
              firstname, lastname, display_name, name_aliases, party,
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
    const aliases = aliasList(person.name_aliases);
    if (!name || (!hasMention(cleanComment, name) && !aliases.some((alias) => hasMention(cleanComment, alias)))) continue;
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

function aliasList(value = "") {
  return String(value || "")
    .split(/[\n,;]/)
    .map((alias) => cleanText(alias))
    .filter(Boolean);
}

function personMentionPath(person = {}) {
  const key = person.slug || person.gc_personid || person.employeeno || person.id || person.filer_entity_number;
  return key ? `/people/${encodeURIComponent(String(key))}` : "";
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
      `SELECT
          m.update_id,
          m.personid,
          m.person_id,
          m.employeeno,
          m.filer_entity_number,
          m.name,
          m.chamber,
          m.party,
          m.district,
          m.path,
          m.role_label,
          p.id AS canonical_person_id,
          p.gc_personid AS canonical_gc_personid,
          p.employeeno AS canonical_employeeno,
          p.filer_entity_number AS canonical_filer_entity_number,
          p.firstname AS canonical_firstname,
          p.lastname AS canonical_lastname,
          p.display_name AS canonical_display_name,
          p.photo_url AS person_photo_url,
          p.slug AS person_slug,
          p.is_current_legislator,
          p.is_2026_candidate,
          lp.photo_url AS legislator_photo_url,
          COALESCE(NULLIF(cr.office, ''), CASE
            WHEN lr.legislativebody = 'S' THEN 'State Senator'
            WHEN lr.legislativebody = 'H' THEN 'State Representative'
            ELSE ''
          END) AS office,
          COALESCE(NULLIF(cr.county, ''), cc.name, '') AS county,
          COALESCE(NULLIF(cr.district, ''), NULLIF(lr.district, ''), m.district, '') AS profile_district
       FROM community_update_mentions m
       LEFT JOIN candidates cm
         ON m.path = '/candidates/' || cm.slug
         OR m.path = '/people/' || cm.slug
       LEFT JOIN d1_people p
         ON p.id = m.person_id
         OR p.gc_personid = m.personid
         OR p.employeeno = m.employeeno
         OR p.filer_entity_number = m.filer_entity_number
         OR p.filer_entity_number = cm.filer_entity_number
         OR m.path = '/people/' || p.slug
         OR m.path = '/candidates/' || p.slug
       LEFT JOIN d1_person_candidate_roles cr
         ON cr.person_id = p.id
         AND cr.election_year = 2026
       LEFT JOIN d1_person_legislator_roles lr
         ON lr.person_id = p.id
         AND lr.active = 1
       LEFT JOIN d1_legislator_photos lp
         ON lp.employeeno = COALESCE(p.employeeno, m.employeeno)
       LEFT JOIN county_codes cc
         ON cc.source_county_id = CAST(lr.countycode AS INTEGER)
       WHERE m.update_id IN (${ids.map(() => "?").join(", ")})
       ORDER BY m.name`,
    )
    .bind(...ids)
    .all();
  const mentionsByUpdate = new Map();

  for (const mention of result.results || []) {
    const list = mentionsByUpdate.get(mention.update_id) || [];
    const name = cleanText(
      mention.canonical_display_name ||
        [mention.canonical_firstname, mention.canonical_lastname].filter(Boolean).join(" ") ||
        mention.name,
    );
    list.push({
      personid: mention.canonical_gc_personid || mention.personid || mention.canonical_person_id,
      personId: mention.canonical_person_id || mention.person_id,
      employeeno: mention.canonical_employeeno || mention.employeeno,
      filerEntityNumber: mention.canonical_filer_entity_number || mention.filer_entity_number,
      personSlug: mention.person_slug || "",
      name,
      chamber: cleanText(mention.chamber),
      party: cleanText(mention.party),
      district: cleanText(mention.district),
      path: personMentionPath({
        slug: mention.person_slug,
        gc_personid: mention.canonical_gc_personid || mention.personid,
        employeeno: mention.canonical_employeeno || mention.employeeno,
        id: mention.canonical_person_id || mention.person_id,
        filer_entity_number: mention.canonical_filer_entity_number || mention.filer_entity_number,
      }),
      roleLabel: cleanText(mention.role_label),
      photoUrl: mention.person_photo_url || mention.legislator_photo_url || "",
      office: cleanText(mention.office),
      county: cleanText(mention.county),
      profileDistrict: cleanText(mention.profile_district),
      isCurrentLegislator: Number(mention.is_current_legislator) === 1,
      is2026Candidate: Number(mention.is_2026_candidate) === 1,
    });
    mentionsByUpdate.set(mention.update_id, list);
  }

  return appendEntitySubjectMentions(
    updates.map((update) => ({
      ...update,
      mentions: mentionsByUpdate.get(update.id) || [],
    })),
    db,
  );
}

async function appendEntitySubjectMentions(updates = [], db = communityUpdatesDb()) {
  if (!updates.length || !db) return updates;

  const cache = new Map();
  const enriched = [];

  for (const update of updates) {
    const entityType = String(update.entityType || update.entity_type || "").toLowerCase();
    const entityKey = String(update.entityKey || update.entity_key || "").trim();
    if (!["representative", "candidate"].includes(entityType) || !entityKey) {
      enriched.push(update);
      continue;
    }

    const cacheKey = `${entityType}:${entityKey}`;
    let subject = cache.get(cacheKey);
    if (subject === undefined) {
      subject = await findUpdateEntitySubject(entityType, entityKey, db);
      cache.set(cacheKey, subject || null);
    }

    if (!subject) {
      enriched.push(update);
      continue;
    }

    const mentions = update.mentions || [];
    const subjectKey = subject.personId || subject.personid || subject.filerEntityNumber || subject.path || subject.name;
    const alreadyMentioned = mentions.some((mention) => {
      const mentionKey = mention.personId || mention.personid || mention.filerEntityNumber || mention.path || mention.name;
      return subjectKey && mentionKey && String(subjectKey) === String(mentionKey);
    });

    enriched.push({
      ...update,
      mentions: alreadyMentioned ? mentions : [subject, ...mentions],
    });
  }

  return enriched;
}

async function findUpdateEntitySubject(entityType = "", entityKey = "", db) {
  const where =
    entityType === "candidate"
      ? `(p.filer_entity_number = ?
          OR p.slug = ?
          OR CAST(p.id AS TEXT) = ?
          OR cr.filer_entity_number = ?
          OR c.filer_entity_number = ?
          OR c.slug = ?
          OR LOWER(p.display_name) = LOWER(?))`
      : `(CAST(p.gc_personid AS TEXT) = ? OR CAST(p.employeeno AS TEXT) = ? OR p.slug = ? OR CAST(p.id AS TEXT) = ?)`;
  const bindings =
    entityType === "candidate"
      ? [entityKey, entityKey, entityKey, entityKey, entityKey, entityKey, cleanText(entityKey).replace(/-/g, " ")]
      : [entityKey, entityKey, entityKey, entityKey];

  const row = await db
    .prepare(
      `SELECT
          p.id,
          p.gc_personid,
          p.employeeno,
          p.filer_entity_number,
          p.slug,
          p.firstname,
          p.lastname,
          p.display_name,
          p.party,
          p.photo_url AS person_photo_url,
          p.is_current_legislator,
          p.is_2026_candidate,
          lp.photo_url AS legislator_photo_url,
          COALESCE(NULLIF(cr.office, ''), CASE
            WHEN lr.legislativebody = 'S' THEN 'State Senator'
            WHEN lr.legislativebody = 'H' THEN 'State Representative'
            ELSE ''
          END) AS office,
          COALESCE(NULLIF(cr.county, ''), cc.name, '') AS county,
          COALESCE(NULLIF(cr.district, ''), NULLIF(lr.district, ''), '') AS profile_district
       FROM d1_people p
       LEFT JOIN d1_person_candidate_roles cr
         ON cr.person_id = p.id
         AND cr.election_year = 2026
       LEFT JOIN candidates c
         ON c.filer_entity_number = p.filer_entity_number
         OR c.slug = p.slug
       LEFT JOIN d1_person_legislator_roles lr
         ON lr.person_id = p.id
         AND lr.active = 1
       LEFT JOIN d1_legislator_photos lp
         ON lp.employeeno = p.employeeno
       LEFT JOIN county_codes cc
         ON cc.source_county_id = CAST(lr.countycode AS INTEGER)
       WHERE ${where}
       ORDER BY
         CASE
           WHEN ? = 'candidate' AND p.is_2026_candidate = 1 THEN 0
           WHEN ? = 'representative' AND p.is_current_legislator = 1 THEN 0
           ELSE 1
         END,
         p.lastname COLLATE NOCASE,
         p.firstname COLLATE NOCASE
       LIMIT 1`,
    )
    .bind(...bindings, entityType, entityType)
    .first();

  if (!row) return null;

  const name = cleanText(
    row.display_name ||
      [row.firstname, row.lastname].filter(Boolean).join(" "),
  );
  const isCurrentLegislator = Number(row.is_current_legislator) === 1;
  const is2026Candidate = Number(row.is_2026_candidate) === 1;

  return {
    personid: row.gc_personid || row.id,
    personId: row.id,
    employeeno: row.employeeno,
    filerEntityNumber: row.filer_entity_number || "",
    personSlug: row.slug || "",
    name,
    chamber: isCurrentLegislator ? "Legislator" : "",
    party: cleanText(row.party),
    district: cleanText(row.profile_district),
    path: personMentionPath(row),
    roleLabel: personRoleLabel({
      is_current_legislator: isCurrentLegislator ? 1 : 0,
      is_2026_candidate: is2026Candidate ? 1 : 0,
    }),
    photoUrl: row.person_photo_url || row.legislator_photo_url || "",
    office: cleanText(row.office),
    county: cleanText(row.county),
    profileDistrict: cleanText(row.profile_district),
    isCurrentLegislator,
    is2026Candidate,
  };
}

async function hydrateUpdatePhotos(updates = [], db = communityUpdatesDb()) {
  if (!updates.length || !db) return updates;
  const ids = updates.map((update) => update.id).filter(Boolean);
  if (!ids.length) return updates;

  const result = await db
    .prepare(
      `SELECT update_id, photo_url
       FROM community_update_photos
       WHERE update_id IN (${ids.map(() => "?").join(", ")})
       ORDER BY sort_order, id`,
    )
    .bind(...ids)
    .all();
  const photosByUpdate = new Map();

  for (const photo of result.results || []) {
    const list = photosByUpdate.get(photo.update_id) || [];
    if (photo.photo_url) list.push(photo.photo_url);
    photosByUpdate.set(photo.update_id, list);
  }

  return updates.map((update) => {
    const photoUrls = [
      ...(photosByUpdate.get(update.id) || []),
      update.photoUrl,
    ].filter(Boolean);
    const uniquePhotoUrls = [...new Set(photoUrls)];

    return {
      ...update,
      photoUrl: uniquePhotoUrls[0] || "",
      photoUrls: uniquePhotoUrls,
    };
  });
}

async function hydrateUpdatePhotosAndMentions(updates = [], db = communityUpdatesDb()) {
  return hydrateUpdateMentions(await hydrateUpdatePhotos(updates, db), db);
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
