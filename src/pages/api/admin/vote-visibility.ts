export const prerender = false;

import {
  adminDb,
  canUseSourceDataTools,
  forbiddenAdminResponse,
  requireAdmin,
} from "../../../lib/adminAuth";
import { rebuildGradeCacheForVoteKey } from "../../../lib/gradeCache";
import { ensureVoteVisibilityTable } from "../../../lib/voteVisibility";

export async function POST({ request }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  if (!canUseSourceDataTools(auth.session)) return forbiddenAdminResponse();

  const wantsHtml = request.headers.get("HX-Request") === "true";

  try {
    const form = await request.formData();
    const key = voteKeyFromForm(form);
    const includeInDisplay = checkboxFlag(form.get("includeInDisplay"));
    const includeInGrades = includeInDisplay ? checkboxFlag(form.get("includeInGrades")) : 0;
    const notes = String(form.get("notes") || "").trim();

    const db = adminDb();
    await ensureVoteVisibilityTable(db);

    await db
      .prepare(
        `INSERT INTO d1_vote_visibility_overrides (
          sessionyear,
          legislativebody,
          votesequencenumber,
          condensedbillno,
          include_in_display,
          include_in_grades,
          notes,
          updated_by,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(sessionyear, legislativebody, votesequencenumber, condensedbillno)
        DO UPDATE SET
          include_in_display = excluded.include_in_display,
          include_in_grades = excluded.include_in_grades,
          notes = excluded.notes,
          updated_by = excluded.updated_by,
          updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(
        key.sessionyear,
        key.legislativebody,
        key.votesequencenumber,
        key.condensedbillno,
        includeInDisplay,
        includeInGrades,
        notes,
        auth.session?.email || "",
      )
      .run();

    const rebuild = await rebuildGradeCacheForVoteKey(db, key);
    const message = includeInDisplay
      ? includeInGrades
        ? `Shown and used for grades. Rebuilt ${rebuild.rebuilt} affected grades.`
        : `Shown, excluded from grades. Rebuilt ${rebuild.rebuilt} affected grades.`
      : `Hidden and excluded from grades. Rebuilt ${rebuild.rebuilt} affected grades.`;

    if (wantsHtml) return htmlStatus(message, "success");
    return redirectWithMessage(request, "Vote visibility updated.");
  } catch (error) {
    const message = error?.message || "Unable to update vote visibility.";
    if (wantsHtml) return htmlStatus(message, "error", 400);
    return redirectWithError(request, message);
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

function checkboxFlag(value) {
  return value === "1" || value === "on" || value === "true" ? 1 : 0;
}

function htmlStatus(message, statusClass, status = 200) {
  return new Response(
    `<span class="inline-status ${statusClass}">${escapeHtml(message)}</span>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}

function redirectWithMessage(request, message) {
  const url = new URL("/admin/votes", request.url);
  url.searchParams.set("message", message);
  return Response.redirect(url, 303);
}

function redirectWithError(request, message) {
  const url = new URL("/admin/votes", request.url);
  url.searchParams.set("error", message);
  return Response.redirect(url, 303);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
