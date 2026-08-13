export const prerender = false;

import {
  canModerateContent,
  forbiddenAdminResponse,
  requireAdmin,
} from "../../../lib/adminAuth";
import { sendSubmissionResponseEmail } from "../../../lib/adminEmail";
import {
  ensureSuggestedUpdatesTable,
  suggestedUpdatesDb,
} from "../../../lib/suggestedUpdates";
import { cleanText } from "../../../lib/text";

export async function POST({ request }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  if (!canModerateContent(auth.session)) return forbiddenAdminResponse();

  const wantsHtml = request.headers.get("HX-Request") === "true";
  let redirectTo = "/admin/moderation#suggested-updates";

  try {
    const form = await request.formData();
    const id = Number(form.get("id") || 0);
    const action = String(form.get("action") || "").trim();
    const responseStatus = normalizeResponseStatus(form.get("responseStatus"));
    const responseNote = cleanText(form.get("responseNote") || "");
    redirectTo = safeRedirectPath(form.get("redirectTo")) || redirectTo;

    if (!id) throw new Error("Suggested update id is required.");
    if (!["save", "close", "delete"].includes(action)) {
      throw new Error("Choose save, close, or delete.");
    }
    if (responseNote && !responseStatus) {
      throw new Error("Choose whether the change was applied or not applied.");
    }

    const db = suggestedUpdatesDb();
    if (!db) throw new Error("D1 database binding is not configured.");
    await ensureSuggestedUpdatesTable(db);

    const existing = await db
      .prepare(
        `SELECT id, page_url, submitter_email, status
         FROM suggested_updates
         WHERE id = ?`,
      )
      .bind(id)
      .first();
    if (!existing) throw new Error("No matching feedback item was found.");

    const status = action === "delete" ? "deleted" : action === "close" ? "reviewed" : existing.status || "pending";
    const result = await db
      .prepare(
        `UPDATE suggested_updates
         SET status = ?,
             reviewed_by = ?,
             reviewed_at = CASE WHEN ? = 'pending' THEN reviewed_at ELSE CURRENT_TIMESTAMP END,
             response_status = COALESCE(NULLIF(?, ''), response_status),
             response_note = COALESCE(NULLIF(?, ''), response_note),
             response_sent_at = CASE WHEN ? != '' THEN CURRENT_TIMESTAMP ELSE response_sent_at END
         WHERE id = ?`,
      )
      .bind(
        status,
        auth.session.email,
        status,
        responseStatus,
        responseNote,
        responseNote,
        id,
      )
      .run();

    const changed = result.meta?.changes ?? result.changes ?? 0;
    if (!changed) throw new Error("No matching feedback item was updated.");

    if (responseNote && existing.submitter_email) {
      try {
        await sendSubmissionResponseEmail({
          to: existing.submitter_email,
          type: "feedback",
          outcome: responseStatus,
          note: responseNote,
          pageUrl: existing.page_url,
        });
      } catch (emailError) {
        console.error(emailError?.message || "Unable to send feedback response email.");
        if (wantsHtml) return htmlMessage("Saved, but the response email could not be sent.", "error", 200);
        return redirectWithMessage(request, redirectTo, "Saved, but the response email could not be sent.");
      }
    }

    const message = action === "save"
      ? "Feedback response saved."
      : action === "delete"
        ? "Feedback deleted."
        : "Feedback closed.";
    if (wantsHtml) return htmlMessage(message, "success");
    return redirectWithMessage(request, redirectTo, message);
  } catch (error) {
    if (wantsHtml) {
      return htmlMessage(error?.message || "Unable to update feedback.", "error", 400);
    }
    return redirectWithError(request, redirectTo, error?.message || "Unable to update feedback.");
  }
}

function normalizeResponseStatus(value = "") {
  const normalized = String(value || "").trim().toLowerCase().replace(/[-\s]+/g, "_");
  if (normalized === "applied") return "applied";
  if (normalized === "not_applied") return "not_applied";
  return "";
}

function safeRedirectPath(value) {
  const path = String(value || "").trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "";
  return path;
}

function redirectWithMessage(request, path, message) {
  const url = new URL(path, request.url);
  url.searchParams.set("message", message);
  return Response.redirect(url, 303);
}

function redirectWithError(request, path, message) {
  const url = new URL(path, request.url);
  url.searchParams.set("error", message);
  return Response.redirect(url, 303);
}

function htmlMessage(message, status = "success", responseStatus = 200) {
  return new Response(
    `<span class="inline-status ${status}">${escapeHtml(message)}</span>`,
    {
      status: responseStatus,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
