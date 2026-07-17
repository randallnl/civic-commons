export const prerender = false;

import { requireAdmin } from "../../../lib/adminAuth";
import {
  importOrganizationsFromSheets,
  saveOrganizationProfile,
} from "../../../lib/organizationsApi";

export async function POST({ request }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  let redirectTo = "/admin";

  try {
    const form = await request.formData();
    const action = String(form.get("action") || "save").trim();
    redirectTo = safeRedirectPath(form.get("redirectTo")) || "/admin";

    if (action === "import-sheets") {
      const result = await importOrganizationsFromSheets();
      return redirectWithMessage(
        request,
        redirectTo,
        `Imported ${result.organizations} organizations, ${result.comments} comments, and ${result.endorsements} endorsements into D1.`,
      );
    }

    if (action !== "save") {
      throw new Error("Choose a valid organization admin action.");
    }

    const result = await saveOrganizationProfile({
      name: form.get("name"),
      slug: form.get("slug"),
      type: form.get("type"),
      mission: form.get("mission"),
      shortDescription: form.get("shortDescription"),
      website: form.get("website"),
      email: form.get("email"),
      phone: form.get("phone"),
      facebook: form.get("facebook"),
      instagram: form.get("instagram"),
      bluesky: form.get("bluesky"),
      city: form.get("city"),
      town: form.get("town"),
      state: form.get("state"),
      serviceArea: form.get("serviceArea"),
      issueArea: form.get("issueArea"),
      logoUrl: form.get("logoUrl"),
      bannerImageUrl: form.get("bannerImageUrl"),
      foundedYear: form.get("foundedYear"),
      approved: form.get("approved") || "0",
      notes: form.get("notes"),
    });

    return redirectWithMessage(request, redirectTo, `Organization profile saved: ${result.slug}.`);
  } catch (error) {
    return redirectWithError(request, redirectTo, error?.message || "Unable to update organizations.");
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
