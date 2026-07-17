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
      const billSelections = selectedBillsFromForm(form);
      const photoUrl = await uploadCommentPhoto({
        file: form.get("photo"),
        organizationSlug,
        bill: billSelections[0]?.code || "",
      });

      if (!billSelections.length) throw new Error("At least one bill is required.");

      const results = [];
      for (const bill of billSelections) {
        results.push(await saveOrganizationComment({
          organizationName: form.get("organizationName"),
          organizationSlug,
          bill: bill.code,
          billLabel: bill.label || bill.code,
          position: form.get("position"),
          issueArea: form.get("issueArea"),
          towns: form.get("towns"),
          comment: form.get("comment"),
          author: form.get("author"),
          date: form.get("date"),
          linkUrl: form.get("linkUrl"),
          linkLabel: form.get("linkLabel"),
          photoUrl,
        }));
      }

      return redirectWithMessage(
        request,
        redirectTo,
        `Organization comment saved for ${organizationSlug} on ${results.map((result) => result.bill).join(", ")}.`,
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

function selectedBillsFromForm(form) {
  const fromJson = String(form.get("billSelections") || "").trim();
  if (fromJson) {
    try {
      const parsed = JSON.parse(fromJson);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => ({
            code: normalizeBillCode(item.code || item.value || item.label || ""),
            label: String(item.label || item.name || item.code || "").trim(),
          }))
          .filter((item) => item.code);
      }
    } catch (error) {
      // Fall back to the visible comma-separated field below.
    }
  }

  return String(form.get("billCodes") || form.get("bill") || "")
    .split(/[,;|\n]/)
    .map((value) => normalizeBillCode(value))
    .filter(Boolean)
    .map((code) => ({ code, label: code }));
}

function normalizeBillCode(value = "") {
  const match = String(value || "").toUpperCase().match(/\b(?:HB|SB|CACR|HCR|HR|SR)\s*\d+[A-Z]?\b/);
  return (match ? match[0] : String(value || ""))
    .toUpperCase()
    .replace(/\s+/g, "");
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
