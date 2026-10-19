export const prerender = false;

import {
  adminDb,
  canUseSourceDataTools,
  forbiddenAdminResponse,
  requireAdmin,
} from "../../../lib/adminAuth";
import { rebuildGradeCacheForBillKey } from "../../../lib/gradeCache";
import { ensureGradeVoteSelectionOverrideTable } from "../../../lib/gradeVoteOverrides";
import { ensureVoteVisibilityTable, voteVisibilityCaseExpression } from "../../../lib/voteVisibility";

export async function POST({ request }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  if (!canUseSourceDataTools(auth.session)) return forbiddenAdminResponse();

  let form = null;
  try {
    form = await request.formData();
    const key = voteKeyFromForm(form);
    const action = String(form.get("action") || "select").trim().toLowerCase();
    const db = adminDb();
    await ensureVoteVisibilityTable(db);
    await ensureGradeVoteSelectionOverrideTable(db);

    if (action === "automatic") {
      await db
        .prepare(
          `DELETE FROM d1_grade_vote_selection_overrides
           WHERE sessionyear = ?
             AND legislativebody = ?
             AND UPPER(condensedbillno) = UPPER(?)`,
        )
        .bind(key.sessionyear, key.legislativebody, key.condensedbillno)
        .run();
    } else if (action === "select") {
      await assertGradeEligibleVote(db, key);
      await db
        .prepare(
          `INSERT INTO d1_grade_vote_selection_overrides (
            sessionyear,
            legislativebody,
            condensedbillno,
            votesequencenumber,
            updated_by,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(sessionyear, legislativebody, condensedbillno)
          DO UPDATE SET
            votesequencenumber = excluded.votesequencenumber,
            updated_by = excluded.updated_by,
            updated_at = CURRENT_TIMESTAMP`,
        )
        .bind(
          key.sessionyear,
          key.legislativebody,
          key.condensedbillno,
          key.votesequencenumber,
          auth.session?.email || "",
        )
        .run();
    } else {
      throw new Error("Unknown alignment vote action.");
    }

    const rebuild = await rebuildGradeCacheForBillKey(db, key);
    const message = action === "automatic"
      ? `Automatic alignment selection restored. Rebuilt ${rebuild.rebuilt} affected grades.`
      : `Vote sequence ${key.votesequencenumber} selected for alignment. Rebuilt ${rebuild.rebuilt} affected grades.`;
    return redirectBack(request, form, "message", message);
  } catch (error) {
    return redirectBack(request, form, "error", error?.message || "Unable to change alignment vote.");
  }
}

async function assertGradeEligibleVote(db, key) {
  const actionSql = `COALESCE(
    NULLIF(TRIM(rs.question_motion), ''),
    NULLIF(TRIM(rs.title1), ''),
    NULLIF(TRIM(rs.title2), '')
  )`;
  const defaultVisibility = voteVisibilityCaseExpression(actionSql);
  const vote = await db
    .prepare(
      `SELECT COALESCE(vvo.include_in_grades, ${defaultVisibility}) AS include_in_grades
       FROM d1_rollcallsummary rs
       LEFT JOIN d1_vote_visibility_overrides vvo
         ON vvo.sessionyear = rs.sessionyear
        AND vvo.legislativebody = rs.legislativebody
        AND vvo.votesequencenumber = rs.votesequencenumber
        AND UPPER(vvo.condensedbillno) = UPPER(rs.condensedbillno)
       WHERE rs.sessionyear = ?
         AND rs.legislativebody = ?
         AND rs.votesequencenumber = ?
         AND UPPER(rs.condensedbillno) = UPPER(?)
       LIMIT 1`,
    )
    .bind(key.sessionyear, key.legislativebody, key.votesequencenumber, key.condensedbillno)
    .first();

  if (!vote) throw new Error("Roll-call vote not found.");
  if (Number(vote.include_in_grades) !== 1) {
    throw new Error("Mark this roll call grade eligible before selecting it for alignment.");
  }
}

function voteKeyFromForm(form) {
  const sessionyear = Number(form.get("sessionyear") || 0);
  const legislativebody = String(form.get("legislativebody") || "").trim().toUpperCase();
  const votesequencenumber = Number(form.get("votesequencenumber") || 0);
  const condensedbillno = String(form.get("condensedbillno") || "").trim().toUpperCase();

  if (!sessionyear) throw new Error("Session year is required.");
  if (!["H", "S"].includes(legislativebody)) throw new Error("Legislative body is required.");
  if (!votesequencenumber) throw new Error("Vote sequence is required.");
  if (!condensedbillno) throw new Error("Bill number is required.");

  return { sessionyear, legislativebody, votesequencenumber, condensedbillno };
}

function redirectBack(request, form, type, message) {
  const fallback = new URL("/admin/votes", request.url);
  const returnTo = String(form?.get("returnTo") || "");
  let url = fallback;
  try {
    const requested = new URL(returnTo, request.url);
    if (requested.origin === fallback.origin && requested.pathname === "/admin/votes") url = requested;
  } catch {}
  url.searchParams.delete("message");
  url.searchParams.delete("error");
  url.searchParams.set(type, message);
  return Response.redirect(url, 303);
}
