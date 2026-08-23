export const prerender = false;

import { env } from "cloudflare:workers";
import {
  adminR2Bucket,
  canModerateContent,
  forbiddenAdminResponse,
  requireAdmin,
} from "../../../lib/adminAuth";
import { sendSubmissionResponseEmail } from "../../../lib/adminEmail";
import {
  ensureCommunityUpdatesTable,
  communityUpdatesDb,
  replaceCommunityUpdatePhotos,
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
    const linkUrl = cleanText(form.get("linkUrl") || "");
    const responseStatus = normalizeResponseStatus(form.get("responseStatus"));
    const responseNote = cleanText(form.get("responseNote") || "");
    const files = form
      .getAll("photos")
      .concat(form.getAll("photo"))
      .filter((file) => file && typeof file !== "string" && file.size);
    const requestedPhotoRemovals = new Set(
      form
        .getAll("removePhotos")
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    );
    const refreshAfterPhotoChange = Boolean(files.length || requestedPhotoRemovals.size);
    redirectTo = safeRedirectPath(form.get("redirectTo")) || "/admin";

    if (!id) throw new Error("Community update id is required.");
    if (!["approve", "reject", "save", "delete"].includes(action)) {
      throw new Error("Choose save, approve, reject, or delete.");
    }
    if (responseNote && !responseStatus) {
      throw new Error("Choose whether the change was applied or not applied.");
    }

    const db = communityUpdatesDb();
    if (!db) throw new Error("D1 database binding is not configured.");
    await ensureCommunityUpdatesTable(db);

    if (action === "delete") {
      const result = await db
        .prepare(
          `UPDATE community_updates
           SET status = 'deleted',
               reviewed_by = ?,
               reviewed_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
        )
        .bind(auth.session.email, id)
        .run();

      const changed = result.meta?.changes ?? result.changes ?? 0;
      if (!changed) throw new Error("No matching community update was found.");

      if (wantsHtml) return htmlMessage("Community update deleted.", "success");
      return redirectWithMessage(request, redirectTo, "Community update deleted.");
    }

    if (action === "save" || action === "approve") {
      const existing = await db
        .prepare("SELECT entity_type, entity_key, photo_url, email, page_url FROM community_updates WHERE id = ?")
        .bind(id)
        .first();
      if (!existing) throw new Error("No matching community update was found.");

      const existingPhotoRows = await db
        .prepare(
          `SELECT photo_url
           FROM community_update_photos
           WHERE update_id = ?
           ORDER BY sort_order, id`,
        )
        .bind(id)
        .all();
      const existingPhotoUrls = [...new Set([
        ...(existingPhotoRows.results || []).map((row) => String(row.photo_url || "").trim()),
        String(existing.photo_url || "").trim(),
      ].filter(Boolean))];
      const retainedPhotoUrls = existingPhotoUrls.filter(
        (url) => !requestedPhotoRemovals.has(url),
      );

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
      const finalPhotoUrls = [...new Set([...retainedPhotoUrls, ...photoUrls])];

      await db
        .prepare(
         `UPDATE community_updates
           SET display_name = ?,
               comment = ?,
               link_url = ?,
               response_status = COALESCE(NULLIF(?, ''), response_status),
               response_note = COALESCE(NULLIF(?, ''), response_note),
               response_sent_at = CASE WHEN ? != '' THEN CURRENT_TIMESTAMP ELSE response_sent_at END
           WHERE id = ?`,
        )
        .bind(displayName, comment, linkUrl, responseStatus, responseNote, responseNote, id)
        .run();

      await replaceCommunityUpdatePhotos(id, finalPhotoUrls, db);

      await db
        .prepare("DELETE FROM community_update_mentions WHERE update_id = ?")
        .bind(id)
        .run();

      if (comment) {
        await saveCommunityUpdateMentions(id, comment, db);
      }

    }

    if (action === "save") {
      const saved = await db
        .prepare("SELECT email, page_url FROM community_updates WHERE id = ?")
        .bind(id)
        .first();
      if (responseNote && saved?.email) {
        try {
          await sendSubmissionResponseEmail({
            to: saved.email,
            type: "community-update",
            outcome: responseStatus,
            note: responseNote,
            pageUrl: saved.page_url,
          });
        } catch (emailError) {
          console.error(emailError?.message || "Unable to send community update response email.");
          if (wantsHtml) return htmlMessage("Community update edits saved, but the response email could not be sent.", "error", 200, refreshAfterPhotoChange);
          return redirectWithMessage(request, redirectTo, "Community update edits saved, but the response email could not be sent.");
        }
      }
      if (wantsHtml) return htmlMessage("Community update edits saved.", "success", 200, refreshAfterPhotoChange);
      return redirectWithMessage(request, redirectTo, "Community update edits saved.");
    }

    const status = action === "approve" ? "approved" : "rejected";
    const existing = await db
      .prepare("SELECT email, page_url FROM community_updates WHERE id = ?")
      .bind(id)
      .first();
    const result = await db
      .prepare(
        `UPDATE community_updates
         SET status = ?,
             reviewed_by = ?,
             reviewed_at = CURRENT_TIMESTAMP,
             response_status = COALESCE(NULLIF(?, ''), response_status),
             response_note = COALESCE(NULLIF(?, ''), response_note),
             response_sent_at = CASE WHEN ? != '' THEN CURRENT_TIMESTAMP ELSE response_sent_at END
         WHERE id = ?`,
      )
      .bind(status, auth.session.email, responseStatus, responseNote, responseNote, id)
      .run();

    const changed = result.meta?.changes ?? result.changes ?? 0;
    if (!changed) throw new Error("No matching community update was found.");

    if (responseNote && existing?.email) {
      try {
        await sendSubmissionResponseEmail({
          to: existing.email,
          type: "community-update",
          outcome: responseStatus,
          note: responseNote,
          pageUrl: existing.page_url,
        });
      } catch (emailError) {
        console.error(emailError?.message || "Unable to send community update response email.");
        if (wantsHtml) return htmlMessage(`Community update ${status}, but the response email could not be sent.`, "error", 200, refreshAfterPhotoChange);
        return redirectWithMessage(request, redirectTo, `Community update ${status}, but the response email could not be sent.`);
      }
    }

    if (wantsHtml) return htmlMessage(`Community update ${status}.`, "success", 200, refreshAfterPhotoChange);
    return redirectWithMessage(request, redirectTo, `Community update ${status}.`);
  } catch (error) {
    if (wantsHtml) {
      return htmlMessage(error?.message || "Unable to moderate community update.", "error", 400);
    }
    return redirectWithError(request, redirectTo, error?.message || "Unable to moderate community update.");
  }
}

function normalizeResponseStatus(value = "") {
  const normalized = String(value || "").trim().toLowerCase().replace(/[-\s]+/g, "_");
  if (normalized === "applied") return "applied";
  if (normalized === "not_applied") return "not_applied";
  return "";
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

function htmlMessage(message, status = "success", responseStatus = 200, refresh = false) {
  const headers = new Headers({
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  if (refresh) headers.set("HX-Refresh", "true");

  return new Response(
    `<span class="inline-status ${status}">${escapeHtml(message)}</span>`,
    {
      status: responseStatus,
      headers,
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
