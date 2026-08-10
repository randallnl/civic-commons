export const prerender = false;

import {
  canEditProfiles,
  forbiddenAdminResponse,
  requireAdmin,
} from "../../../lib/adminAuth";
import { moderateProfileUpdateSubmission } from "../../../lib/profileUpdateSubmissions";

export async function POST({ request }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  if (!canEditProfiles(auth.session)) return forbiddenAdminResponse();

  const wantsHtml = request.headers.get("HX-Request") === "true";
  let redirectTo = "/admin?area=moderation#profile-updates";

  try {
    const form = await request.formData();
    const id = Number(form.get("id"));
    const action = String(form.get("action") || "").trim();
    redirectTo = safeRedirectPath(form.get("redirectTo")) || redirectTo;

    await moderateProfileUpdateSubmission({
      id,
      action,
      reviewedBy: auth.session?.email || "",
    });

    const message = action === "approve"
      ? "Profile update approved and applied."
      : "Profile update rejected.";

    if (wantsHtml) return htmlMessage(message, "success");
    return redirectWithMessage(request, redirectTo, message);
  } catch (error) {
    const message = error?.message || "Unable to moderate profile update.";
    if (wantsHtml) return htmlMessage(message, "error", 400);
    return redirectWithError(request, redirectTo, message);
  }
}

function htmlMessage(message, type = "success", status = 200) {
  return new Response(`<span class="inline-status ${type}">${escapeHtml(message)}</span>`, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeRedirectPath(value = "") {
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
