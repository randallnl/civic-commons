import { adminDb } from "./adminAuth";
import { cleanText } from "./text";

export async function ensureUnifiedPeopleTables(db = adminDb()) {
  if (!db) return;

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS d1_people (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gc_personid INTEGER UNIQUE,
        employeeno INTEGER UNIQUE,
        filer_entity_number TEXT UNIQUE,
        firstname TEXT,
        lastname TEXT,
        middlename TEXT,
        display_name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        party TEXT,
        email TEXT,
        phone TEXT,
        website_url TEXT,
        photo_url TEXT,
        is_current_legislator INTEGER NOT NULL DEFAULT 0,
        is_2026_legislator INTEGER NOT NULL DEFAULT 0,
        is_2026_candidate INTEGER NOT NULL DEFAULT 0,
        is_free_stater INTEGER NOT NULL DEFAULT 0,
        source TEXT NOT NULL DEFAULT 'runtime',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    )
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS d1_person_legislator_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        person_id INTEGER NOT NULL,
        gc_personid INTEGER,
        employeeno INTEGER,
        legislativebody TEXT,
        countycode TEXT,
        district TEXT,
        seatno TEXT,
        towns_represented TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        session_year INTEGER NOT NULL DEFAULT 2026,
        source TEXT NOT NULL DEFAULT 'd1_legislators',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(person_id, legislativebody, countycode, district, session_year)
      )`,
    )
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS d1_person_candidate_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        person_id INTEGER NOT NULL,
        filer_entity_number TEXT NOT NULL,
        office_type TEXT,
        office TEXT,
        county TEXT,
        district TEXT,
        political_party TEXT,
        election_year INTEGER NOT NULL DEFAULT 2026,
        election_cycle TEXT,
        total_raised REAL,
        total_spent REAL,
        status TEXT NOT NULL DEFAULT 'active',
        source TEXT NOT NULL DEFAULT 'candidates',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(filer_entity_number, election_year)
      )`,
    )
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS d1_article_people (
        article_id INTEGER NOT NULL,
        person_id INTEGER NOT NULL,
        relation_type TEXT NOT NULL DEFAULT 'mentioned',
        source TEXT NOT NULL DEFAULT 'runtime',
        raw_name TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(article_id, person_id, relation_type)
      )`,
    )
    .run();

  await Promise.all([
    db.prepare("CREATE INDEX IF NOT EXISTS idx_d1_people_name ON d1_people(lastname, firstname)").run(),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_d1_people_candidate ON d1_people(is_2026_candidate, filer_entity_number)").run(),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_d1_people_legislator ON d1_people(is_current_legislator, gc_personid)").run(),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_d1_article_people_person ON d1_article_people(person_id)").run(),
  ]);
}

export async function personIdForLegislator(identifier, db = adminDb()) {
  if (!db) return null;
  const numeric = Number(identifier);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  await ensureUnifiedPeopleTables(db);

  let person = await db
    .prepare("SELECT id FROM d1_people WHERE gc_personid = ? OR employeeno = ? LIMIT 1")
    .bind(numeric, numeric)
    .first();
  if (person?.id) return person.id;

  await upsertPersonFromLegislator(numeric, db);
  person = await db
    .prepare("SELECT id FROM d1_people WHERE gc_personid = ? OR employeeno = ? LIMIT 1")
    .bind(numeric, numeric)
    .first();
  return person?.id || null;
}

export async function personIdForCandidate(filerEntityNumber, db = adminDb()) {
  if (!db) return null;
  const filer = String(filerEntityNumber || "").trim();
  if (!filer) return null;
  await ensureUnifiedPeopleTables(db);

  let person = await db
    .prepare("SELECT id FROM d1_people WHERE filer_entity_number = ? LIMIT 1")
    .bind(filer)
    .first();
  if (person?.id) return person.id;

  await upsertPersonFromCandidate(filer, db);
  person = await db
    .prepare("SELECT id FROM d1_people WHERE filer_entity_number = ? LIMIT 1")
    .bind(filer)
    .first();
  return person?.id || null;
}

export async function syncCandidateLegislatorIdentity(candidateFilerEntityNumber, representativePersonId, db = adminDb()) {
  if (!db) return { changed: 0 };
  const filer = String(candidateFilerEntityNumber || "").trim();
  const personid = Number(representativePersonId);
  if (!filer || !Number.isFinite(personid) || personid <= 0) return { changed: 0 };

  await ensureUnifiedPeopleTables(db);
  await upsertPersonFromLegislator(personid, db);
  const personId = await personIdForLegislator(personid, db);
  if (!personId) return { changed: 0 };

  const candidate = await candidateRow(filer, db);
  if (!candidate) return { changed: 0 };

  await mergeCandidatePersonIntoLegislatorPerson(personId, filer, personid, db);

  const result = await db
    .prepare(
      `UPDATE d1_people
       SET filer_entity_number = ?,
           website_url = COALESCE(NULLIF(?, ''), website_url),
           photo_url = COALESCE(NULLIF(photo_url, ''), ?),
           is_2026_candidate = CASE WHEN ? = 2026 THEN 1 ELSE is_2026_candidate END,
           is_free_stater = CASE WHEN ? = 1 THEN 1 ELSE is_free_stater END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .bind(
      filer,
      candidate.candidate_website || "",
      candidate.photo_url || "",
      Number(candidate.election_year) || null,
      freeStaterInt(candidate.is_free_stater),
      personId,
    )
    .run();

  await upsertCandidateRole(personId, candidate, db);
  return { changed: result.meta?.changes ?? result.changes ?? 0 };
}

async function mergeCandidatePersonIntoLegislatorPerson(personId, filer, representativePersonId, db) {
  const candidatePerson = await db
    .prepare(
      `SELECT id, gc_personid, employeeno
       FROM d1_people
       WHERE filer_entity_number = ?
       LIMIT 1`,
    )
    .bind(filer)
    .first();

  if (!candidatePerson?.id || Number(candidatePerson.id) === Number(personId)) return;

  const linkedGcPersonId = Number(candidatePerson.gc_personid || 0);
  const linkedEmployeeNo = Number(candidatePerson.employeeno || 0);
  const representativeId = Number(representativePersonId);
  const belongsToAnotherLegislator =
    (linkedGcPersonId && linkedGcPersonId !== representativeId) ||
    (linkedEmployeeNo && linkedEmployeeNo !== representativeId);

  if (belongsToAnotherLegislator) {
    throw new Error(
      "That candidate filer number is already linked to a different legislator profile.",
    );
  }

  await db
    .prepare(
      `UPDATE d1_person_candidate_roles
       SET person_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE person_id = ?`,
    )
    .bind(personId, candidatePerson.id)
    .run();

  await db
    .prepare(
      `UPDATE OR IGNORE d1_article_people
       SET person_id = ?
       WHERE person_id = ?`,
    )
    .bind(personId, candidatePerson.id)
    .run();

  await db
    .prepare(
      `DELETE FROM d1_article_people
       WHERE person_id = ?`,
    )
    .bind(candidatePerson.id)
    .run();

  await db
    .prepare(
      `DELETE FROM d1_people
       WHERE id = ?`,
    )
    .bind(candidatePerson.id)
    .run();
}

export async function linkArticlePersonByLegislator(articleId, legislator = {}, db = adminDb()) {
  const personId = await personIdForLegislator(legislator.personid || legislator.employeeno, db);
  if (!personId) return { changed: 0 };
  return insertArticlePerson(articleId, personId, legislator.name || legislator.legislator_name_raw, "d1_article_legislators", db);
}

export async function linkArticlePersonByCandidate(articleId, candidate = {}, db = adminDb()) {
  const personId = await personIdForCandidate(candidate.filerEntityNumber || candidate.filer_entity_number, db);
  if (!personId) return { changed: 0 };
  return insertArticlePerson(articleId, personId, candidate.name || candidate.candidate_name_raw, "d1_article_candidates", db);
}

export async function linkArticlePersonByPersonId(articleId, personId, rawName = "", db = adminDb()) {
  return insertArticlePerson(articleId, personId, rawName, "manual", db);
}

export async function getPeopleLinkOptions({ limit = 900, db = adminDb() } = {}) {
  if (!db) return [];
  await ensureUnifiedPeopleTables(db);

  const result = await db
    .prepare(
      `SELECT id, gc_personid, employeeno, filer_entity_number, display_name,
              firstname, lastname, party, is_current_legislator, is_2026_candidate
       FROM d1_people
       WHERE is_current_legislator = 1
          OR is_2026_candidate = 1
       ORDER BY lastname COLLATE NOCASE, firstname COLLATE NOCASE, display_name COLLATE NOCASE
       LIMIT ?`,
    )
    .bind(limit)
    .all();

  return (result.results || []).map((person) => ({
    ...person,
    value: String(person.id),
    label: peopleOptionLabel(person),
  }));
}

async function insertArticlePerson(articleId, personId, rawName = "", source = "runtime", db = adminDb()) {
  if (!db || !articleId || !personId) return { changed: 0 };
  await ensureUnifiedPeopleTables(db);
  const result = await db
    .prepare(
      `INSERT OR IGNORE INTO d1_article_people (
         article_id, person_id, relation_type, source, raw_name
       )
       VALUES (?, ?, 'mentioned', ?, ?)`,
    )
    .bind(articleId, personId, source, cleanText(rawName || ""))
    .run();
  return { changed: result.meta?.changes ?? result.changes ?? 0 };
}

export async function upsertPersonFromLegislator(identifier, db = adminDb()) {
  if (!db) return null;
  await ensureUnifiedPeopleTables(db);
  const numeric = Number(identifier);
  const rep = await db
    .prepare(
      `SELECT l.*, COALESCE(p.photo_url, '') AS photo_url
       FROM d1_legislators l
       LEFT JOIN d1_legislator_photos p
         ON p.employeeno = l.employeeno
       WHERE l.personid = ? OR l.employeeno = ?
       LIMIT 1`,
    )
    .bind(numeric, numeric)
    .first();
  if (!rep) return null;

  const result = await db
    .prepare(
      `INSERT INTO d1_people (
         gc_personid, employeeno, firstname, lastname, middlename, display_name,
         slug, party, email, photo_url, is_current_legislator, is_2026_legislator,
         is_free_stater, source, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'd1_legislators', CURRENT_TIMESTAMP)
       ON CONFLICT(gc_personid) DO UPDATE SET
         employeeno = excluded.employeeno,
         firstname = excluded.firstname,
         lastname = excluded.lastname,
         middlename = excluded.middlename,
         display_name = excluded.display_name,
         party = excluded.party,
         email = excluded.email,
         photo_url = COALESCE(NULLIF(excluded.photo_url, ''), d1_people.photo_url),
         is_current_legislator = excluded.is_current_legislator,
         is_2026_legislator = excluded.is_2026_legislator,
         is_free_stater = CASE WHEN excluded.is_free_stater = 1 THEN 1 ELSE d1_people.is_free_stater END,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      rep.personid,
      rep.employeeno,
      rep.firstname || "",
      rep.lastname || "",
      rep.middlename || "",
      displayName(rep.firstname, rep.lastname),
      personSlug(rep.firstname, rep.lastname, rep.personid),
      rep.party || "",
      rep.emailaddress || "",
      rep.photo_url || "",
      Number(rep.active) === 1 ? 1 : 0,
      Number(rep.active) === 1 ? 1 : 0,
      freeStaterInt(rep.is_free_stater),
    )
    .run();

  const personId = await personIdForLegislator(rep.personid, db);
  if (personId) await upsertLegislatorRole(personId, rep, db);
  return result;
}

export async function upsertPersonFromCandidate(filer, db = adminDb()) {
  if (!db) return null;
  await ensureUnifiedPeopleTables(db);
  const candidate = await candidateRow(filer, db);
  if (!candidate) return null;

  const result = await db
    .prepare(
      `INSERT INTO d1_people (
         filer_entity_number, firstname, lastname, display_name, slug, party,
         email, website_url, photo_url, is_2026_candidate, is_free_stater,
         source, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'candidates', CURRENT_TIMESTAMP)
       ON CONFLICT(filer_entity_number) DO UPDATE SET
         firstname = excluded.firstname,
         lastname = excluded.lastname,
         display_name = excluded.display_name,
         party = excluded.party,
         email = excluded.email,
         website_url = excluded.website_url,
         photo_url = excluded.photo_url,
         is_2026_candidate = excluded.is_2026_candidate,
         is_free_stater = CASE WHEN excluded.is_free_stater = 1 THEN 1 ELSE d1_people.is_free_stater END,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      candidate.filer_entity_number,
      candidate.candidate_first_name || "",
      candidate.candidate_last_name || "",
      displayName(candidate.candidate_first_name, candidate.candidate_last_name),
      candidate.slug || personSlug(candidate.candidate_first_name, candidate.candidate_last_name, candidate.filer_entity_number),
      candidate.political_party || "",
      candidate.candidate_email || "",
      candidate.candidate_website || "",
      candidate.photo_url || "",
      Number(candidate.election_year) === 2026 ? 1 : 0,
      freeStaterInt(candidate.is_free_stater),
    )
    .run();

  const personId = await personIdForCandidate(candidate.filer_entity_number, db);
  if (personId) await upsertCandidateRole(personId, candidate, db);
  return result;
}

async function upsertLegislatorRole(personId, rep, db) {
  await db
    .prepare(
      `INSERT OR IGNORE INTO d1_person_legislator_roles (
         person_id, gc_personid, employeeno, legislativebody, countycode,
         district, seatno, active, session_year, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 2026, CURRENT_TIMESTAMP)`,
    )
    .bind(
      personId,
      rep.personid || null,
      rep.employeeno || null,
      rep.legislativebody || "",
      rep.countycode || "",
      rep.district || "",
      rep.seatno || "",
      Number(rep.active) === 1 ? 1 : 0,
    )
    .run();
}

async function upsertCandidateRole(personId, candidate, db) {
  await db
    .prepare(
      `INSERT INTO d1_person_candidate_roles (
         person_id, filer_entity_number, office_type, office, county, district,
         political_party, election_year, election_cycle, total_raised, total_spent,
         updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(filer_entity_number, election_year) DO UPDATE SET
         person_id = excluded.person_id,
         office_type = excluded.office_type,
         office = excluded.office,
         county = excluded.county,
         district = excluded.district,
         political_party = excluded.political_party,
         election_cycle = excluded.election_cycle,
         total_raised = excluded.total_raised,
         total_spent = excluded.total_spent,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      personId,
      candidate.filer_entity_number,
      candidate.office_type || "",
      candidate.office || "",
      candidate.county || "",
      candidate.district || "",
      candidate.political_party || "",
      Number(candidate.election_year) || 2026,
      candidate.election_cycle || "",
      Number(candidate.total_raised) || 0,
      Number(candidate.total_spent) || 0,
    )
    .run();
}

async function candidateRow(filer, db) {
  return db
    .prepare(
      `SELECT *
       FROM candidates
       WHERE filer_entity_number = ? OR slug = ?
       LIMIT 1`,
    )
    .bind(filer, filer)
    .first();
}

function displayName(first = "", last = "") {
  return cleanText([first, last].filter(Boolean).join(" "));
}

function personSlug(first = "", last = "", suffix = "") {
  return [first, last, suffix]
    .filter(Boolean)
    .join("-")
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function freeStaterInt(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").toLowerCase()) ? 1 : 0;
}

function peopleOptionLabel(person = {}) {
  const roles = [];
  if (Number(person.is_current_legislator) === 1) roles.push("Legislator");
  if (Number(person.is_2026_candidate) === 1) roles.push("Candidate");
  return [
    cleanText(person.display_name || displayName(person.firstname, person.lastname)),
    roles.join(" + "),
    person.party,
    person.gc_personid ? `GC ${person.gc_personid}` : "",
    person.filer_entity_number ? `Filer ${person.filer_entity_number}` : "",
  ].filter(Boolean).join(" - ");
}
