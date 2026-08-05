export const prerender = false;

import { env } from "cloudflare:workers";
import {
  adminR2Bucket,
  canModerateContent,
  forbiddenAdminResponse,
  requireAdmin,
} from "../../../lib/adminAuth";
import {
  ensureCommunityUpdatesTable,
  communityUpdatesDb,
  saveCommunityUpdatePhotos,
  saveCommunityUpdateMentions,
} from "../../../lib/communityUpdates";
import { cleanText } from "../../../lib/text";

export async function POST({ request }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  if (!canModerateContent(auth.session)) return forbiddenAdminResponse();

  const wantsHtml = request.headers.get("HX-Request") === "true";
  let redirectTo = "/admin";
  try {
    const form = await request.formData();
    const id = Number(form.get("id") || 0);
    const action = String(form.get("action") || "").trim();
    const comment = cleanText(form.get("comment") || "");
    const displayName = cleanText(form.get("displayName") || "") || "Community member";
    const files = form
      .getAll("photos")
      .concat(form.getAll("photo"))
      .filter((file) => file && typeof file !== "string" && file.size);
    redirectTo = safeRedirectPath(form.get("redirectTo")) || "/admin";

    if (!id) throw new Error("Community update id is required.");
    if (!["approve", "reject", "save"].includes(action)) {
      throw new Error("Choose save, approve, or reject.");
    }

    const db = communityUpdatesDb();
    if (!db) throw new Error("D1 database binding is not configured.");
    await ensureCommunityUpdatesTable(db);

    if (action === "save" || action === "approve") {
      const existing = await db
        .prepare("SELECT entity_type, entity_key, photo_url FROM community_updates WHERE id = ?")
        .bind(id)
        .first();
      if (!existing) throw new Error("No matching community update was found.");

      const photoUrls = files.length
        ? await Promise.all(
            files.slice(0, 8).map((file, index) =>
              uploadCommunityPhoto(
                file,
                existing.entity_type || "community-update",
                existing.entity_key || String(id),
                index,
              ),
            ),
          )
        : [];

      await db
        .prepare(
          `UPDATE community_updates
           SET display_name = ?,
               comment = ?,
               photo_url = COALESCE(NULLIF(photo_url, ''), ?)
           WHERE id = ?`,
        )
        .bind(displayName, comment, photoUrls[0] || "", id)
        .run();

      await db
        .prepare("DELETE FROM community_update_mentions WHERE update_id = ?")
        .bind(id)
        .run();

      if (comment) {
        await saveCommunityUpdateMentions(id, comment, db);
      }

      if (photoUrls.length) {
        await saveCommunityUpdatePhotos(id, photoUrls, db);
      }
    }

    if (action === "save") {
      if (wantsHtml) return htmlMessage("Community update edits saved.", "success");
      return redirectWithMessage(request, redirectTo, "Community update edits saved.");
    }

    const status = action === "approve" ? "approved" : "rejected";
    const result = await db
      .prepare(
        `UPDATE community_updates
         SET status = ?,
             reviewed_by = ?,
             reviewed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .bind(status, auth.session.email, id)
      .run();

    const changed = result.meta?.changes ?? result.changes ?? 0;
    if (!changed) throw new Error("No matching community update was found.");

    if (wantsHtml) return htmlMessage(`Community update ${status}.`, "success");
    return redirectWithMessage(request, redirectTo, `Community update ${status}.`);
  } catch (error) {
    if (wantsHtml) {
      return htmlMessage(error?.message || "Unable to moderate community update.", "error", 400);
    }
    return redirectWithError(request, redirectTo, error?.message || "Unable to moderate community update.");
  }
}

function safeRedirectPath(value) {
  const path = String(value || "").trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "";
  return path;
}

async function uploadCommunityPhoto(file, entityType, entityKey, index = 0) {
  const bucket = adminR2Bucket();
  if (!bucket) throw new Error("Photo uploads are temporarily unavailable.");

  const key = [
    "community-updates",
    String(entityType || "community-update"),
    slugify(entityKey),
    `${Date.now()}-${index + 1}-${sanitizeFilename(file.name || "photo.jpg")}`,
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
