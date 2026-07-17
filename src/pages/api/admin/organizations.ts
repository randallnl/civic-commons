export const prerender = false;

import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../lib/adminAuth";
import {
  importOrganizationsFromSheets,
  saveOrganizationComment,
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

    if (action === "save-comment") {
      const organizationSlug = String(form.get("organizationSlug") || "").trim();
      const bill = String(form.get("bill") || "").trim();
      const photoUrl = await uploadCommentPhoto({
        file: form.get("photo"),
        organizationSlug,
        bill,
      });

      const result = await saveOrganizationComment({
        organizationName: form.get("organizationName"),
        organizationSlug,
        bill,
        billLabel: form.get("billLabel"),
        position: form.get("position"),
        issueArea: form.get("issueArea"),
        towns: form.get("towns"),
        comment: form.get("comment"),
        author: form.get("author"),
        date: form.get("date"),
        linkUrl: form.get("linkUrl"),
        linkLabel: form.get("linkLabel"),
        photoUrl,
      });

      return redirectWithMessage(
        request,
        redirectTo,
        `Organization comment saved for ${result.organizationSlug} on ${result.bill}.`,
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

async function uploadCommentPhoto({ file, organizationSlug = "", bill = "" } = {}) {
  if (!file || typeof file === "string" || !file.size) return "";
  const bucket = env["organization-assets"];
  if (!bucket) throw new Error("Organization asset bucket is not configured.");

  const key = [
    "organizations",
    "comments",
    slugify(organizationSlug || "organization"),
    `${slugify(bill || "bill")}-${Date.now()}-${sanitizeFilename(file.name || "comment-photo")}`,
  ].join("/");

  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type || contentTypeFor(key),
      cacheControl: "public, max-age=86400",
    },
  });

  return `/api/organization-assets/${key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

function sanitizeFilename(value = "") {
  return String(value)
    .trim()
    .replace(/[/\\]/g, "-")
    .replace(/[^a-zA-Z0-9._ -]+/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function contentTypeFor(key = "") {
  const extension = key.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "avif":
      return "image/avif";
    case "gif":
      return "image/gif";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}
