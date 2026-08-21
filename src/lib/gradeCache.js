import {
  isKnownVote,
  isVoteIncludedInGrade,
  isVotingAction,
  normalizeBillCode,
  representativeOnlineTestimonyAnalysis,
  representativeOnlineTestimonyGrade,
} from "./trackedBills";
import { ensureVoteVisibilityTable, voteVisibilityCaseExpression } from "./voteVisibility";

const GRADE_COLUMNS = [
  ["online_testimony_alignment_pct", "REAL"],
  ["online_testimony_grade", "TEXT"],
  ["online_testimony_scored_votes", "INTEGER"],
  ["online_testimony_aligned_votes", "INTEGER"],
  ["online_testimony_partial_votes", "INTEGER"],
  ["online_testimony_misaligned_votes", "INTEGER"],
  ["grade_updated_at", "TEXT"],
];

export async function ensureGradeCacheColumns(db) {
  if (!db) throw new Error("D1 database binding is not configured.");

  const info = await db.prepare("PRAGMA table_info(d1_people)").all();
  const existing = new Set((info.results || []).map((column) => column.name));

  for (const [column, definition] of GRADE_COLUMNS) {
    if (!existing.has(column)) {
      await db.prepare(`ALTER TABLE d1_people ADD COLUMN ${column} ${definition}`).run();
    }
  }

  await db
    .prepare("CREATE INDEX IF NOT EXISTS idx_d1_people_grade_updated ON d1_people(grade_updated_at)")
    .run();
}

export async function rebuildAllGradeCaches(db, { limit = 500 } = {}) {
  await ensureGradeCacheColumns(db);

  const result = await db
    .prepare(
      `SELECT id, gc_personid, employeeno
       FROM d1_people
       WHERE is_current_legislator = 1
         AND employeeno IS NOT NULL
       ORDER BY lastname, firstname, display_name
       LIMIT ?`,
    )
    .bind(limit)
    .all();

  const summaries = await loadBillSummaryMap(db);
  const rebuilt = [];

  for (const person of result.results || []) {
    rebuilt.push(await rebuildGradeCacheForPerson(db, person, { summaries, ensureColumns: false }));
  }

  return {
    requested: (result.results || []).length,
    rebuilt: rebuilt.filter((item) => item?.updated).length,
    skipped: rebuilt.filter((item) => !item?.updated).length,
  };
}

export async function rebuildGradeCacheForVoteKey(db, key = {}) {
  await ensureGradeCacheColumns(db);

  const result = await db
    .prepare(
      `SELECT DISTINCT p.id, p.gc_personid, p.employeeno
       FROM d1_rollcallhistory h
       JOIN d1_people p
         ON p.employeeno = h.employeenumber
       WHERE h.sessionyear = ?
         AND h.legislativebody = ?
         AND h.votesequencenumber = ?
         AND UPPER(h.condensedbillno) = UPPER(?)
         AND p.is_current_legislator = 1`,
    )
    .bind(
      Number(key.sessionyear || 0),
      String(key.legislativebody || "").toUpperCase(),
      Number(key.votesequencenumber || 0),
      String(key.condensedbillno || "").toUpperCase(),
    )
    .all();

  const summaries = await loadBillSummaryMap(db);
  let rebuilt = 0;

  for (const person of result.results || []) {
    const updated = await rebuildGradeCacheForPerson(db, person, { summaries, ensureColumns: false });
    if (updated?.updated) rebuilt += 1;
  }

  return { affected: (result.results || []).length, rebuilt };
}

export async function rebuildGradeCacheForPerson(db, person = {}, options = {}) {
  if (options.ensureColumns !== false) await ensureGradeCacheColumns(db);

  const personRow = person.id
    ? person
    : await findPersonForGrade(db, person.personId || person.personid || person.gc_personid || person.employeeno);

  if (!personRow?.id || !personRow?.employeeno) {
    return { updated: false, reason: "No current legislator row found." };
  }

  const summaries = options.summaries || await loadBillSummaryMap(db);
  const votes = await loadVotesForEmployee(db, personRow.employeeno);
  const grade = representativeOnlineTestimonyGrade(votes, summaries);

  if (!grade) {
    await db
      .prepare(
        `UPDATE d1_people
         SET online_testimony_alignment_pct = NULL,
             online_testimony_grade = NULL,
             online_testimony_scored_votes = 0,
             online_testimony_aligned_votes = 0,
             online_testimony_partial_votes = 0,
             online_testimony_misaligned_votes = 0,
             grade_updated_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .bind(personRow.id)
      .run();

    return { updated: true, personId: personRow.id, grade: null };
  }

  const analyses = votes
    .filter((vote) => isVotingAction(vote) && isKnownVote(vote) && isVoteIncludedInGrade(vote))
    .map((vote) => representativeOnlineTestimonyAnalysis(vote, summaries.get(normalizeBillCode(vote.condensedbillno))))
    .filter((analysis) => Number.isFinite(analysis?.score));
  const partial = analyses.filter((analysis) => analysis.alignment === "partial").length;
  const misaligned = analyses.filter((analysis) => analysis.alignment === "misaligned").length;

  await db
    .prepare(
      `UPDATE d1_people
       SET online_testimony_alignment_pct = ?,
           online_testimony_grade = ?,
           online_testimony_scored_votes = ?,
           online_testimony_aligned_votes = ?,
           online_testimony_partial_votes = ?,
           online_testimony_misaligned_votes = ?,
           grade_updated_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .bind(
      grade.percent,
      grade.letter,
      grade.total || 0,
      grade.aligned || 0,
      partial,
      misaligned,
      personRow.id,
    )
    .run();

  return { updated: true, personId: personRow.id, grade };
}

async function findPersonForGrade(db, identifier) {
  if (!identifier) return null;

  return db
    .prepare(
      `SELECT id, gc_personid, employeeno
       FROM d1_people
       WHERE id = ?
          OR gc_personid = ?
          OR employeeno = ?
       LIMIT 1`,
    )
    .bind(identifier, identifier, identifier)
    .first();
}

async function loadBillSummaryMap(db) {
  await ensureBillOverrideTable(db);

  const result = await db
    .prepare(
      `SELECT
         b.sessionyear,
         b.condensedbillno,
         COALESCE(NULLIF(bo.title, ''), b.description, b.condensedbillno) AS name,
         NULLIF(bo.summary, '') AS summary,
         b.support_count,
         b.oppose_count,
         b.neutral_count,
         b.testimony_count
       FROM d1_bills b
       LEFT JOIN d1_bill_overrides bo
         ON bo.sessionyear = b.sessionyear
        AND UPPER(bo.condensedbillno) = UPPER(b.condensedbillno)
       ORDER BY b.sessionyear DESC`,
    )
    .all();

  const summaries = new Map();

  for (const bill of result.results || []) {
    const code = normalizeBillCode(bill.condensedbillno);
    if (!code || summaries.has(code)) continue;
    summaries.set(code, bill);
  }

  return summaries;
}

async function ensureBillOverrideTable(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS d1_bill_overrides (
        sessionyear INTEGER NOT NULL,
        condensedbillno TEXT NOT NULL,
        title TEXT,
        summary TEXT,
        description TEXT,
        updated_by TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (sessionyear, condensedbillno)
      )`,
    )
    .run();
}

async function loadVotesForEmployee(db, employeeno) {
  await ensureVoteVisibilityTable(db);

  const actionSql = `COALESCE(
    NULLIF(TRIM(rs.question_motion), ''),
    NULLIF(TRIM(rs.title1), ''),
    NULLIF(TRIM(rs.title2), '')
  )`;
  const defaultVisibilitySql = voteVisibilityCaseExpression(actionSql);
  const result = await db
    .prepare(
      `SELECT
         h.sessionyear,
         h.legislativebody,
         h.votesequencenumber,
         h.condensedbillno,
         CAST(h.vote AS INTEGER) AS vote_code,
         CASE CAST(h.vote AS INTEGER)
           WHEN 1 THEN 'yea'
           WHEN 2 THEN 'nay'
           WHEN 3 THEN 'absent'
           WHEN 4 THEN 'present'
           WHEN 5 THEN 'other_not_voting'
           WHEN 6 THEN 'other_present_not_voting'
           WHEN 7 THEN 'other_present_not_voting'
           WHEN 0 THEN 'other_not_counted'
           ELSE 'unknown'
         END AS vote,
         rs.question_motion,
         rs.title1,
         rs.title2,
         rs.votedate AS vote_date,
         ${actionSql} AS action_text,
         COALESCE(vvo.include_in_display, ${defaultVisibilitySql}) AS include_in_display,
         COALESCE(vvo.include_in_grades, ${defaultVisibilitySql}) AS include_in_grades
       FROM d1_rollcallhistory h
       LEFT JOIN d1_rollcallsummary rs
         ON rs.sessionyear = h.sessionyear
        AND rs.legislativebody = h.legislativebody
        AND rs.votesequencenumber = h.votesequencenumber
       LEFT JOIN d1_vote_visibility_overrides vvo
         ON vvo.sessionyear = h.sessionyear
        AND vvo.legislativebody = h.legislativebody
        AND vvo.votesequencenumber = h.votesequencenumber
        AND UPPER(vvo.condensedbillno) = UPPER(h.condensedbillno)
       WHERE h.employeenumber = ?
         AND rs.votesequencenumber IS NOT NULL
         AND TRIM(CAST(h.vote AS TEXT)) IN ('0', '1', '2', '3', '4', '5', '6', '7')
       ORDER BY h.sessionyear DESC, h.votesequencenumber DESC`,
    )
    .bind(employeeno)
    .all();

  return result.results || [];
}
