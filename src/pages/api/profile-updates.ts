export const prerender = false;

import {
  createProfileUpdateSubmission,
  uploadPendingProfilePhoto,
} from "../../lib/profileUpdateSubmissions";

export async function POST({ request }) {
  let redirectTo = "/";

  try {
    const form = await request.formData();
    redirectTo = safeRedirectPath(form.get("redirectTo")) || "/";
    const personKey = String(form.get("personKey") || "").trim();
    const photoFile = form.get("photo");
    const photo = photoFile && typeof photoFile !== "string" && photoFile.size
      ? await uploadPendingProfilePhoto({ file: photoFile, personKey })
      : { photoUrl: "", photoKey: "" };

    await createProfileUpdateSubmission({
      personKey,
      personName: form.get("personName"),
      pageUrl: form.get("pageUrl"),
      submitterName: form.get("submitterName"),
      submitterEmail: form.get("submitterEmail"),
      websiteUrl: form.get("websiteUrl"),
      substackUrl: form.get("substackUrl"),
      instagramUrl: form.get("instagramUrl"),
      facebookUrl: form.get("facebookUrl"),
      tiktokUrl: form.get("tiktokUrl"),
      notes: form.get("notes"),
      photoUrl: photo.photoUrl,
      photoKey: photo.photoKey,
    });

    return redirectWithMessage(request, redirectTo, "Thanks. Your profile update was submitted for review.");
  } catch (error) {
    return redirectWithError(request, redirectTo, error?.message || "Unable to submit profile update.");
  }
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
