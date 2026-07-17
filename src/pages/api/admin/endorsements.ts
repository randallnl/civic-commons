export const prerender = false;

import { requireAdmin } from "../../../lib/adminAuth";
import {
  moderateOrganizationEndorsement,
  saveOrganizationEndorsement,
} from "../../../lib/organizationsApi";

export async function POST({ request }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  let redirectTo = "/admin";

  try {
    const form = await request.formData();
    const action = String(form.get("action") || "").trim();
    redirectTo = safeRedirectPath(form.get("redirectTo")) || "/admin";

    if (["approve", "reject"].includes(action)) {
      const result = await moderateOrganizationEndorsement(form.get("id"), action, {
        reviewedBy: auth.session.email,
      });
      return redirectWithMessage(request, redirectTo, `Endorsement ${result.status}.`);
    }

    if (action !== "save") {
      throw new Error("Choose a valid endorsement admin action.");
    }

    const result = await saveOrganizationEndorsement({
      organizationName: form.get("organizationName"),
      organizationSlug: form.get("organizationSlug"),
      organizationWebsite: form.get("organizationWebsite"),
      organizationEmail: form.get("organizationEmail"),
      candidateName: form.get("candidateName"),
      candidateSlug: form.get("candidateSlug"),
      office: form.get("office"),
      district: form.get("district"),
      electionYear: form.get("electionYear"),
      position: form.get("position") || "Endorsed",
      statement: form.get("statement"),
      date: form.get("date"),
    });

    return redirectWithMessage(
      request,
      redirectTo,
      `Endorsement saved for ${result.candidateSlugKey}.`,
    );
  } catch (error) {
    return redirectWithError(request, redirectTo, error?.message || "Unable to update endorsements.");
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
