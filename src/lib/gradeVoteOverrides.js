export async function ensureGradeVoteSelectionOverrideTable(db) {
  if (!db) throw new Error("D1 database binding is not configured.");

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS d1_grade_vote_selection_overrides (
        sessionyear INTEGER NOT NULL,
        legislativebody TEXT NOT NULL,
        condensedbillno TEXT NOT NULL,
        votesequencenumber INTEGER NOT NULL,
        notes TEXT,
        updated_by TEXT,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (sessionyear, legislativebody, condensedbillno)
      )`,
    )
    .run();
}

export async function clearGradeVoteOverrideForSequence(db, key = {}) {
  await ensureGradeVoteSelectionOverrideTable(db);
  return db
    .prepare(
      `DELETE FROM d1_grade_vote_selection_overrides
       WHERE sessionyear = ?
         AND legislativebody = ?
         AND UPPER(condensedbillno) = UPPER(?)
         AND votesequencenumber = ?`,
    )
    .bind(
      Number(key.sessionyear || 0),
      String(key.legislativebody || "").trim().toUpperCase(),
      String(key.condensedbillno || "").trim().toUpperCase(),
      Number(key.votesequencenumber || 0),
    )
    .run();
}
