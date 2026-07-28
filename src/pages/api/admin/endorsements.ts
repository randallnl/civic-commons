export const prerender = false;

import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../lib/adminAuth";
import {
  moderateOrganizationEndorsement,
  saveOrganizationEndorsement,
} from "../../../lib/organizationsApi";

export async function POST({ request }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const wantsHtml = request.headers.get("HX-Request") === "true";
  let redirectTo = "/admin";

  try {
    const form = await request.formData();
    const action = String(form.get("action") || "").trim();
    redirectTo = safeRedirectPath(form.get("redirectTo")) || "/admin";

    if (["approve", "reject"].includes(action)) {
      const result = await moderateOrganizationEndorsement(form.get("id"), action, {
        reviewedBy: auth.session.email,
      });
      if (wantsHtml) return htmlMessage(`Endorsement ${result.status}.`, "success");
      return redirectWithMessage(request, redirectTo, `Endorsement ${result.status}.`);
    }

    if (action !== "save") {
      throw new Error("Choose a valid endorsement admin action.");
    }

    const photoUrl = await uploadEndorsementPhoto({
      file: form.get("photo"),
      organizationName: form.get("organizationName"),
      candidateSlug: form.get("candidateSlug"),
    });

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
      photoUrl,
      date: form.get("date"),
    });

    return redirectWithMessage(
      request,
      redirectTo,
      `Endorsement saved for ${result.candidateSlugKey}.`,
    );
  } catch (error) {
    if (wantsHtml) {
      return htmlMessage(error?.message || "Unable to update endorsements.", "error", 400);
    }
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
