import { env } from "cloudflare:workers";
import { cleanText } from "./text";

export function voteVisibilityDb() {
  return env.d1_db || env.DB;
}

export async function ensureVoteVisibilityTable(db = voteVisibilityDb()) {
  if (!db) throw new Error("D1 database binding is not configured.");

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS d1_vote_visibility_overrides (
        sessionyear INTEGER NOT NULL,
        legislativebody TEXT NOT NULL,
        votesequencenumber INTEGER NOT NULL,
        condensedbillno TEXT NOT NULL,
        include_in_display INTEGER NOT NULL DEFAULT 1,
        include_in_grades INTEGER NOT NULL DEFAULT 1,
        notes TEXT,
        updated_by TEXT,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (
          sessionyear,
          legislativebody,
          votesequencenumber,
          condensedbillno
        )
      )`,
    )
    .run();

  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_vote_visibility_bill
       ON d1_vote_visibility_overrides(sessionyear, condensedbillno)`,
    )
    .run();
}

export function isProceduralAlignmentMotion(value = "") {
  const motion = cleanText(value).toLowerCase();
  return motion.includes("adopt amendment") || motion.includes("special order");
}

export function defaultVoteVisibility(vote = {}) {
  const action = [
    vote.action_text,
    vote.question_motion,
    vote.motion,
    vote.title1,
    vote.title2,
    vote.description,
  ]
    .filter(Boolean)
    .join(" ");
  const procedural = isProceduralAlignmentMotion(action);

  return {
    includeInDisplay: procedural ? 0 : 1,
    includeInGrades: procedural ? 0 : 1,
    reason: procedural ? "Procedural motion" : "Voting action",
  };
}

export function effectiveVoteVisibility(vote = {}) {
  const defaults = defaultVoteVisibility(vote);
  const displayValue = flagValue(vote.include_in_display ?? vote.includeInDisplay);
  const gradeValue = flagValue(vote.include_in_grades ?? vote.includeInGrades);

  return {
    includeInDisplay: displayValue === null ? defaults.includeInDisplay : displayValue,
    includeInGrades: gradeValue === null ? defaults.includeInGrades : gradeValue,
    reason: defaults.reason,
  };
}

export function voteVisibilityCaseExpression(actionExpression) {
  return `CASE
    WHEN UPPER(COALESCE(${actionExpression}, '')) LIKE '%ADOPT AMENDMENT%'
      OR UPPER(COALESCE(${actionExpression}, '')) LIKE '%SPECIAL ORDER%'
    THEN 0
    ELSE 1
  END`;
}

function flagValue(value) {
  if (value === null || value === undefined || value === "") return null;
  if (value === true) return 1;
  if (value === false) return 0;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on", "include", "included"].includes(normalized)) return 1;
  if (["0", "false", "no", "off", "exclude", "excluded"].includes(normalized)) return 0;
  return null;
}
