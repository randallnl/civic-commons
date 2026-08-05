export const prerender = false;

import {
  canUseSourceDataTools,
  forbiddenAdminResponse,
  requireAdmin,
} from "../../../lib/adminAuth";
import { updateVolunteerReviewer } from "../../../lib/volunteerReviewers";

export async function POST({ request }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  if (!canUseSourceDataTools(auth.session)) return forbiddenAdminResponse();

  let redirectTo = "/admin#reviewer-access";
  try {
    const form = await request.formData();
    redirectTo = safeRedirectPath(form.get("redirectTo")) || redirectTo;

    await updateVolunteerReviewer({
      id: form.get("id"),
      email: form.get("email"),
      role: String(form.get("role") || "volunteer"),
      status: String(form.get("status") || "pending"),
      notes: form.get("notes"),
      reviewedBy: auth.session.email,
    });

    return redirectWithMessage(request, redirectTo, "Reviewer access updated.");
  } catch (error) {
    return redirectWithError(request, redirectTo, error?.message || "Unable to update reviewer access.");
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
