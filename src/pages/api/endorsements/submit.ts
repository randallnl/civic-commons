export const prerender = false;

import { env } from "cloudflare:workers";
import {
  getOrganization,
  saveOrganizationEndorsementSubmission,
  slugify,
} from "../../../lib/organizationsApi";

export async function POST({ request }) {
  let redirectTo = "/endorsements/submit";

  try {
    const form = await request.formData();
    redirectTo = safeRedirectPath(form.get("redirectTo")) || redirectTo;

    const organizationName = String(form.get("organizationName") || "").trim();
    const organizationSlug = String(form.get("organizationSlug") || "").trim();
    const candidateName = String(form.get("candidateName") || "").trim();
    const candidateSlug = String(form.get("candidateSlug") || "").trim();

    if (!organizationName) throw new Error("Organization name is required.");
    if (!organizationSlug) {
      throw new Error("Choose an existing organization profile from the organization selector before submitting an endorsement.");
    }
    if (!candidateName || !candidateSlug) {
      throw new Error("Choose a candidate from the candidate selector.");
    }

    const organization = await getOrganization(organizationSlug);
    if (!organization) {
      throw new Error("That organization profile was not found. Create the organization profile before submitting an endorsement.");
    }

    const photoUrl = await uploadEndorsementPhoto({
      file: form.get("photo"),
      organizationName: organization.name,
      candidateSlug,
    });

    await saveOrganizationEndorsementSubmission({
      organizationName: organization.name,
      organizationSlug: organization.slug,
      organizationWebsite: form.get("organizationWebsite") || organization.website,
      organizationEmail: form.get("organizationEmail") || organization.email,
      candidateName,
      candidateSlug,
      office: form.get("office"),
      district: form.get("district"),
      electionYear: form.get("electionYear"),
      position: form.get("position") || "Endorsed",
      statement: form.get("statement"),
      photoUrl,
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

async function uploadEndorsementPhoto({ file, organizationName = "", candidateSlug = "" } = {}) {
  if (!file || typeof file === "string" || !file.size) return "";
  const bucket = env["organization-assets"];
  if (!bucket) throw new Error("Organization asset bucket is not configured.");

  const key = [
    "organizations",
    "endorsements",
    slugify(organizationName || "organization"),
    `${slugify(candidateSlug || "candidate")}-${Date.now()}-${sanitizeFilename(file.name || "endorsement-photo")}`,
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
