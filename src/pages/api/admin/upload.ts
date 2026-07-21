export const prerender = false;

import { env } from "cloudflare:workers";
import { adminDb, adminR2Bucket, requireAdmin } from "../../../lib/adminAuth";
import {
  ensureOrganizationTables,
  slugify as organizationSlugify,
} from "../../../lib/organizationsApi";
import {
  ensureUnifiedPeopleTables,
  upsertPersonFromCandidate,
  upsertPersonFromLegislator,
} from "../../../lib/unifiedPeople";

export async function POST({ request }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  let redirectTo = "/admin";
  try {
    const form = await request.formData();
    const entityType = String(form.get("entityType") || "").trim();
    const entityKey = String(form.get("entityKey") || "").trim();
    const bucket = uploadBucket(entityType);
    if (!bucket) throw new Error("R2 bucket binding is not configured.");

    redirectTo = safeRedirectPath(form.get("redirectTo")) || "/admin";
    const file = form.get("file");
    const key = sanitizeKey(form.get("key")) || generatedKey(entityType, entityKey, file);

    if (!key) throw new Error("A valid R2 key is required.");
    if (!file || typeof file === "string" || !file.size) {
      throw new Error("Image file is required.");
    }

    const contentType = file.type || contentTypeFor(key);
    const publicUrl = publicAssetUrl(entityType, key);

    await bucket.put(key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=86400",
      },
    });

    const updateSummary = await updateProfilePhoto({
      entityType,
      entityKey,
      key,
      publicUrl,
    });

    const message = updateSummary
      ? `Uploaded ${key} and updated ${updateSummary}.`
      : `Uploaded ${key}.`;

    return redirectWithMessage(request, redirectTo, message, publicUrl);
  } catch (error) {
    return redirectWithError(request, redirectTo, error?.message || "Unable to upload image.");
  }
}

function sanitizeKey(value = "") {
  const key = String(value).trim();

  if (
    !key ||
    key.startsWith("/") ||
    key.includes("..") ||
    key.includes("\\")
  ) {
    return "";
  }

  return key;
}

async function updateProfilePhoto({ entityType, entityKey, key, publicUrl }) {
  if (!entityType && !entityKey) return "";
  if (!["candidate", "representative", "organization-logo"].includes(entityType)) {
    throw new Error("Choose candidate, legislator, or organization logo before updating D1.");
  }
  if (!entityKey) throw new Error("A profile identifier is required to update D1.");

  if (entityType === "candidate") {
    return updateCandidatePhoto(entityKey, publicUrl);
  }

  if (entityType === "organization-logo") {
    return updateOrganizationLogo(entityKey, key);
  }

  return updateRepresentativePhoto(entityKey, key, publicUrl);
}

async function updateCandidatePhoto(entityKey, publicUrl) {
  const db = adminDb();
  if (!db) throw new Error("D1 database binding is not configured.");

  await ensureUnifiedPeopleTables(db);

  const unifiedResult = await db
    .prepare(
      `UPDATE d1_people
       SET photo_url = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE filer_entity_number = ?
          OR slug = ?
          OR CAST(id AS TEXT) = ?`,
    )
    .bind(publicUrl, String(entityKey), String(entityKey), String(entityKey))
    .run();

  const unifiedChanges = unifiedResult.meta?.changes ?? unifiedResult.changes ?? 0;

  const legacyResult = await db
    .prepare(
      `UPDATE candidates
       SET photo_url = ?
       WHERE filer_entity_number = ? OR slug = ?`,
    )
    .bind(publicUrl, String(entityKey), String(entityKey))
    .run();

  const legacyChanges = legacyResult.meta?.changes ?? legacyResult.changes ?? 0;
  const changes = unifiedChanges + legacyChanges;
  if (!changes) throw new Error("No matching candidate row was updated.");
  if (legacyChanges) await upsertPersonFromCandidate(String(entityKey), db);
  return "candidate photo_url";
}

async function updateRepresentativePhoto(entityKey, key, publicUrl) {
  const db = adminDb();
  if (!db) throw new Error("D1 database binding is not configured.");

  const numericKey = numericId(entityKey);
  const slug = organizationSlugify(entityKey);
  const legislator = await db
    .prepare(
      `SELECT personid, employeeno, firstname, lastname
       FROM d1_legislators
       WHERE personid = ?
          OR employeeno = ?
          OR LOWER(REPLACE(TRIM(firstname || '-' || lastname), ' ', '-')) = ?
       LIMIT 1`,
    )
    .bind(numericKey, numericKey, slug)
    .first();

  if (!legislator) throw new Error("No matching legislator row was found.");

  await db
    .prepare(
      `INSERT INTO d1_legislator_photos (
        employeeno,
        personid,
        firstname,
        lastname,
        filename,
        photo_url,
        source,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'admin-upload', CURRENT_TIMESTAMP)
      ON CONFLICT(employeeno) DO UPDATE SET
        personid = excluded.personid,
        firstname = excluded.firstname,
        lastname = excluded.lastname,
        filename = excluded.filename,
        photo_url = excluded.photo_url,
        source = excluded.source,
        updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      legislator.employeeno,
      legislator.personid,
      legislator.firstname,
      legislator.lastname,
      key.split("/").pop(),
      publicUrl,
    )
    .run();

  await upsertPersonFromLegislator(legislator.personid, db);
  return "d1_legislator_photos";
}

async function updateOrganizationLogo(entityKey, key) {
  const db = adminDb();
  if (!db) throw new Error("D1 database binding is not configured.");
  await ensureOrganizationTables(db);

  const slug = slugify(entityKey);
  const result = await db
    .prepare(
      `UPDATE organizations
       SET logo_url = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE slug = ? OR LOWER(name) = LOWER(?)`,
    )
    .bind(key, slug, String(entityKey))
    .run();

  const changes = result.meta?.changes ?? result.changes ?? 0;
  if (!changes) throw new Error("No matching organization row was updated.");
  return "organization logo_url";
}

function generatedKey(entityType, entityKey, file) {
  if (!file || typeof file === "string") return "";
  const filename = sanitizeFilename(file.name || "profile-photo");
  const prefix = entityType === "candidate"
    ? "candidates"
    : entityType === "representative"
      ? "legislators"
      : entityType === "organization-logo"
        ? "organizations/logos"
      : "uploads";
  const id = slugify(entityKey || "image");
  return sanitizeKey(`${prefix}/${id}-${filename}`);
}

function uploadBucket(entityType) {
  if (entityType === "organization-logo") {
    return env["organization-assets"];
  }
  return adminR2Bucket();
}

function publicAssetUrl(entityType, key = "") {
  if (entityType === "organization-logo") {
    return `/api/organization-assets/${encodeAssetKey(key)}`;
  }
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

function numericId(value = "") {
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : null;
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

function redirectWithMessage(request, path, message, imageUrl = "") {
  const url = new URL(path, request.url);
  url.searchParams.set("message", message);
  if (imageUrl) url.searchParams.set("imageUrl", imageUrl);
  return Response.redirect(url, 303);
}

function redirectWithError(request, path, message) {
  const url = new URL(path, request.url);
  url.searchParams.set("error", message);
  return Response.redirect(url, 303);
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
    case "svg":
      return "image/svg+xml";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}
