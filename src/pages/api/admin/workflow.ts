export const prerender = false;

import { canModerateContent, forbiddenAdminResponse, requireAdmin } from "../../../lib/adminAuth";
import { updateWorkflowItem, workflowLabel } from "../../../lib/adminWorkflow";

export async function POST({ request }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  if (!canModerateContent(auth.session)) return forbiddenAdminResponse();

  const wantsHtml = request.headers.get("HX-Request") === "true";
  let redirectTo = "/admin";

  try {
    const form = await request.formData();
    const entityType = String(form.get("entityType") || "").trim();
    const id = Number(form.get("id") || 0);
    const action = String(form.get("workflowAction") || "").trim();
    const note = String(form.get("moderatorNote") || "").trim();
    redirectTo = safeRedirectPath(form.get("redirectTo")) || "/admin";

    const result = await updateWorkflowItem({
      entityType,
      id,
      action,
      note,
      reviewer: auth.session.email,
    });
    const message = `${workflowLabel(result.status)}${result.assignedTo ? ` by ${result.assignedTo}` : ""}.`;

    if (wantsHtml) return htmlMessage(message, "success");
    return redirectWithMessage(request, redirectTo, message);
  } catch (error) {
    if (wantsHtml) {
      return htmlMessage(error?.message || "Unable to update workflow status.", "error", 400);
    }
    return redirectWithError(request, redirectTo, error?.message || "Unable to update workflow status.");
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
