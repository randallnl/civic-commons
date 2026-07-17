export const prerender = false;

import { saveOrganizationEndorsementSubmission } from "../../../lib/organizationsApi";

export async function POST({ request }) {
  let redirectTo = "/endorsements/submit";

  try {
    const form = await request.formData();
    redirectTo = safeRedirectPath(form.get("redirectTo")) || redirectTo;

    const organizationName = String(form.get("organizationName") || "").trim();
    const candidateName = String(form.get("candidateName") || "").trim();
    const candidateSlug = String(form.get("candidateSlug") || "").trim();

    if (!organizationName) throw new Error("Organization name is required.");
    if (!candidateName || !candidateSlug) {
      throw new Error("Choose a candidate from the candidate selector.");
    }

    await saveOrganizationEndorsementSubmission({
      organizationName,
      organizationWebsite: form.get("organizationWebsite"),
      organizationEmail: form.get("organizationEmail"),
      candidateName,
      candidateSlug,
      office: form.get("office"),
      district: form.get("district"),
      electionYear: form.get("electionYear"),
      position: form.get("position") || "Endorsed",
      statement: form.get("statement"),
      date: form.get("date"),
      submitterName: form.get("submitterName"),
      submitterEmail: form.get("submitterEmail"),
    });

    const url = new URL(redirectTo, request.url);
    url.searchParams.set("submitted", "1");
    return Response.redirect(url, 303);
  } catch (error) {
    const url = new URL(redirectTo, request.url);
    url.searchParams.set("error", error?.message || "Unable to submit endorsement.");
    return Response.redirect(url, 303);
  }
}

function safeRedirectPath(value) {
  const path = String(value || "").trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "";
  return path;
}
