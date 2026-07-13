import { adminDb } from "./adminAuth";
import { syncCandidateLegislatorIdentity } from "./unifiedPeople";

export async function ensureCandidateLegislatorLinkTable(db = adminDb()) {
  if (!db) return;

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS admin_candidate_legislator_links (
        candidate_filer_entity_number TEXT PRIMARY KEY,
        representative_personid INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    )
    .run();

  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_admin_candidate_legislator_links_representative
       ON admin_candidate_legislator_links(representative_personid)`,
    )
    .run();
}

export async function linkCandidateToLegislator(candidateFilerEntityNumber, representativePersonId, db = adminDb()) {
  if (!db) throw new Error("D1 database binding is not configured.");
  const candidateId = String(candidateFilerEntityNumber || "").trim();
  const personId = Number(representativePersonId);

  if (!candidateId) throw new Error("Candidate filer entity number is required.");

  await ensureCandidateLegislatorLinkTable(db);

  if (!Number.isFinite(personId) || personId <= 0) {
    await db
      .prepare(
        `DELETE FROM admin_candidate_legislator_links
         WHERE candidate_filer_entity_number = ?`,
      )
      .bind(candidateId)
      .run();
    return { changed: 1, cleared: true };
  }

  const result = await db
    .prepare(
      `INSERT INTO admin_candidate_legislator_links (
         candidate_filer_entity_number,
         representative_personid,
         created_at,
         updated_at
       )
       VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(candidate_filer_entity_number) DO UPDATE SET
         representative_personid = excluded.representative_personid,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(candidateId, personId)
    .run();

  await syncCandidateLegislatorIdentity(candidateId, personId, db);

  return { changed: result.meta?.changes ?? result.changes ?? 0 };
}

export async function linkLegislatorToCandidate(representativePersonId, candidateFilerEntityNumber, db = adminDb()) {
  if (!db) throw new Error("D1 database binding is not configured.");
  const personId = Number(representativePersonId);
  const candidateId = String(candidateFilerEntityNumber || "").trim();

  if (!Number.isFinite(personId) || personId <= 0) {
    throw new Error("A numeric legislator personid is required.");
  }

  await ensureCandidateLegislatorLinkTable(db);

  await db
    .prepare(
      `DELETE FROM admin_candidate_legislator_links
       WHERE representative_personid = ?`,
    )
    .bind(personId)
    .run();

  if (!candidateId) return { changed: 1, cleared: true };

  const result = await db
    .prepare(
      `INSERT INTO admin_candidate_legislator_links (
         candidate_filer_entity_number,
         representative_personid,
         created_at,
         updated_at
       )
       VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(candidate_filer_entity_number) DO UPDATE SET
         representative_personid = excluded.representative_personid,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(candidateId, personId)
    .run();

  await syncCandidateLegislatorIdentity(candidateId, personId, db);

  return { changed: result.meta?.changes ?? result.changes ?? 0 };
}

export async function candidateLegislatorLinks(db = adminDb()) {
  if (!db) return [];
  await ensureCandidateLegislatorLinkTable(db);

  const result = await db
    .prepare(
      `SELECT candidate_filer_entity_number, representative_personid
       FROM admin_candidate_legislator_links`,
    )
    .all();

  return result.results || [];
}

export async function representativePersonIdForCandidate(candidateFilerEntityNumber, db = adminDb()) {
  if (!db) return "";
  const candidateId = String(candidateFilerEntityNumber || "").trim();
  if (!candidateId) return "";

  await ensureCandidateLegislatorLinkTable(db);
  const row = await db
    .prepare(
      `SELECT representative_personid
       FROM admin_candidate_legislator_links
       WHERE candidate_filer_entity_number = ?
       LIMIT 1`,
    )
    .bind(candidateId)
    .first();

  return row?.representative_personid || "";
}

export async function candidateFilerForRepresentative(representativePersonId, db = adminDb()) {
  if (!db) return "";
  const personId = Number(representativePersonId);
  if (!Number.isFinite(personId) || personId <= 0) return "";

  await ensureCandidateLegislatorLinkTable(db);
  const row = await db
    .prepare(
      `SELECT candidate_filer_entity_number
       FROM admin_candidate_legislator_links
       WHERE representative_personid = ?
       LIMIT 1`,
    )
    .bind(personId)
    .first();

  return row?.candidate_filer_entity_number || "";
}
