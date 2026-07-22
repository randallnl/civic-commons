export const prerender = false;

import { requireAdmin } from "../../../lib/adminAuth";
import {
  ensureCommunityUpdatesTable,
  communityUpdatesDb,
  saveCommunityUpdateMentions,
} from "../../../lib/communityUpdates";
import { cleanText } from "../../../lib/text";

export async function POST({ request }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const wantsHtml = request.headers.get("HX-Request") === "true";
  let redirectTo = "/admin";
  try {
    const form = await request.formData();
    const id = Number(form.get("id") || 0);
    const action = String(form.get("action") || "").trim();
    const comment = cleanText(form.get("comment") || "");
    const displayName = cleanText(form.get("displayName") || "") || "Community member";
    redirectTo = safeRedirectPath(form.get("redirectTo")) || "/admin";

    if (!id) throw new Error("Community update id is required.");
    if (!["approve", "reject", "save"].includes(action)) {
      throw new Error("Choose save, approve, or reject.");
    }

    const db = communityUpdatesDb();
    if (!db) throw new Error("D1 database binding is not configured.");
    await ensureCommunityUpdatesTable(db);

    if (action === "save" || action === "approve") {
      await db
        .prepare(
          `UPDATE community_updates
           SET display_name = ?,
               comment = ?
           WHERE id = ?`,
        )
        .bind(displayName, comment, id)
        .run();

      await db
        .prepare("DELETE FROM community_update_mentions WHERE update_id = ?")
        .bind(id)
        .run();

      if (comment) {
        await saveCommunityUpdateMentions(id, comment, db);
      }
    }

    if (action === "save") {
      if (wantsHtml) return htmlMessage("Community update edits saved.", "success");
      return redirectWithMessage(request, redirectTo, "Community update edits saved.");
    }

    const status = action === "approve" ? "approved" : "rejected";
    const result = await db
      .prepare(
        `UPDATE community_updates
         SET status = ?,
             reviewed_by = ?,
             reviewed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .bind(status, auth.session.email, id)
      .run();

    const changed = result.meta?.changes ?? result.changes ?? 0;
    if (!changed) throw new Error("No matching community update was found.");

    if (wantsHtml) return htmlMessage(`Community update ${status}.`, "success");
    return redirectWithMessage(request, redirectTo, `Community update ${status}.`);
  } catch (error) {
    if (wantsHtml) {
      return htmlMessage(error?.message || "Unable to moderate community update.", "error", 400);
    }
    return redirectWithError(request, redirectTo, error?.message || "Unable to moderate community update.");
  }
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
