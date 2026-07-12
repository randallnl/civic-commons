export const prerender = false;

import { env } from "cloudflare:workers";
import { adminR2Bucket } from "../../lib/adminAuth";
import { ensureCommunityUpdatesTable, communityUpdatesDb } from "../../lib/communityUpdates";

export async function POST({ request }) {
  let redirectTo = "/";

  try {
    const form = await request.formData();
    const entityType = String(form.get("entityType") || "").trim();
    const entityKey = String(form.get("entityKey") || "").trim();
    const entityName = String(form.get("entityName") || "").trim();
    const pageUrl = String(form.get("pageUrl") || "").trim();
    const displayName = String(form.get("displayName") || "").trim() || "Community member";
    const email = String(form.get("email") || "").trim();
    const comment = String(form.get("comment") || "").trim();
    const linkUrl = normalizeLinkUrl(form.get("linkUrl"));
    const file = form.get("photo");
    redirectTo = safeRedirectPath(form.get("redirectTo")) || pageUrl || "/";

    if (!["candidate", "representative"].includes(entityType)) {
      throw new Error("Choose a candidate or legislator page.");
    }
    if (!entityKey) throw new Error("Profile identifier is required.");
    if (!comment && !linkUrl && (!file || typeof file === "string" || !file.size)) {
      throw new Error("Add a comment, link, or photo.");
    }

    const photoUrl =
      file && typeof file !== "string" && file.size
        ? await uploadCommunityPhoto(file, entityType, entityKey)
        : "";

    const db = communityUpdatesDb();
    if (!db) throw new Error("D1 database binding is not configured.");
    await ensureCommunityUpdatesTable(db);

    await db
      .prepare(
        `INSERT INTO community_updates (
          entity_type, entity_key, entity_name, page_url, display_name,
          email, comment, link_url, photo_url, status, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
      )
      .bind(
        entityType,
        entityKey,
        entityName,
        pageUrl,
        displayName,
        email,
        comment,
        linkUrl,
        photoUrl,
      )
      .run();

    return redirectWithMessage(
      request,
      redirectTo,
      "Thanks. Your community update was submitted for review.",
    );
  } catch (error) {
    return redirectWithError(request, redirectTo, error?.message || "Unable to submit community update.");
  }
}

async function uploadCommunityPhoto(file, entityType, entityKey) {
  const bucket = adminR2Bucket();
  if (!bucket) throw new Error("Photo uploads are temporarily unavailable.");

  const key = [
    "community-updates",
    entityType,
    slugify(entityKey),
    `${Date.now()}-${sanitizeFilename(file.name || "photo.jpg")}`,
  ].join("/");

  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type || contentTypeFor(key),
      cacheControl: "public, max-age=86400",
    },
  });

  return publicPhotoUrl(key);
}

function publicPhotoUrl(key = "") {
  const base =
    stringBinding(env.PHOTO_PUBLIC_BASE) ||
    stringBinding(env.PHOTOS_PUBLIC_BASE) ||
    "https://photos.nhdeservesbetter.com";
  return `${base.replace(/\/+$/, "")}/${encodeAssetKey(key)}`;
}

function stringBinding(binding) {
  if (!binding || typeof binding !== "string") return "";
  return binding.trim();
}

function encodeAssetKey(key = "") {
  return key.split("/").map((part) => encodeURIComponent(part)).join("/");
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
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  return "image/jpeg";
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeRedirectPath(value) {
  const path = String(value || "").trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "";
  return path;
}

function normalizeLinkUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Only http or https links are supported.");
    }
    return url.toString();
  } catch (error) {
    if (error?.message?.includes("Only http")) throw error;
    throw new Error("Add a valid link URL.");
  }
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
