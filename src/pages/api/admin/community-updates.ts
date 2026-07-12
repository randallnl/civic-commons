export const prerender = false;

import { requireAdmin } from "../../../lib/adminAuth";
import { ensureCommunityUpdatesTable, communityUpdatesDb } from "../../../lib/communityUpdates";

export async function POST({ request }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  let redirectTo = "/admin";
  try {
    const form = await request.formData();
    const id = Number(form.get("id") || 0);
    const action = String(form.get("action") || "").trim();
    redirectTo = safeRedirectPath(form.get("redirectTo")) || "/admin";

    if (!id) throw new Error("Community update id is required.");
    if (!["approve", "reject"].includes(action)) {
      throw new Error("Choose approve or reject.");
    }

    const db = communityUpdatesDb();
    if (!db) throw new Error("D1 database binding is not configured.");
    await ensureCommunityUpdatesTable(db);

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

    return redirectWithMessage(request, redirectTo, `Community update ${status}.`);
  } catch (error) {
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
