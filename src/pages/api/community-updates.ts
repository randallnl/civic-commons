export const prerender = false;

import { env, waitUntil } from "cloudflare:workers";
import { adminR2Bucket } from "../../lib/adminAuth";
import { sendSubmissionReceivedEmail } from "../../lib/adminEmail";
import {
  captureCommunityUpdateScreenshot,
  markCommunityUpdateArchivePending,
} from "../../lib/communityUpdateArchives";
import {
  ensureCommunityUpdatesTable,
  communityUpdatesDb,
  normalizeBillPosition,
  normalizeCommunityUpdateContentType,
  normalizeStatementFormat,
  saveCommunityUpdatePhotos,
  saveCommunityUpdateMentions,
} from "../../lib/communityUpdates";
import { getArticlePreview } from "../../lib/articlePreviews";

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
    const contentType = entityType === "bill"
      ? normalizeCommunityUpdateContentType(form.get("contentType"))
      : "community_comment";
    const billPosition = entityType === "bill"
      ? normalizeBillPosition(form.get("billPosition"))
      : "";
    const statementFormat = entityType === "bill" && contentType === "public_statement"
      ? normalizeStatementFormat(form.get("statementFormat"))
      : "";
    const taggedPersonIds = form
      .getAll("taggedPersonIds")
      .map(Number)
      .filter((id) => Number.isSafeInteger(id) && id > 0)
      .slice(0, 20);
    const files = form
      .getAll("photos")
      .concat(form.getAll("photo"))
      .filter((file) => file && typeof file !== "string" && file.size);
    redirectTo = safeRedirectPath(form.get("redirectTo")) || pageUrl || "/";

    if (!["candidate", "representative", "bill", "report"].includes(entityType)) {
      throw new Error("Choose a candidate, legislator, bill, or report page.");
    }
    if (!entityKey) throw new Error("Page identifier is required.");
    if (!comment && !linkUrl && !files.length) {
      throw new Error("Add a comment, link, or photo.");
    }
    if (entityType === "bill" && contentType === "public_statement" && !linkUrl) {
      throw new Error("Add a source link for a candidate or legislator statement.");
    }
    if (entityType === "bill" && contentType === "public_statement" && !comment) {
      throw new Error("Add the quoted statement or a clear summary of it.");
    }
    if (entityType === "bill" && contentType === "public_statement" && !taggedPersonIds.length) {
      throw new Error("Select the candidate or legislator who made the statement using the @ suggestions.");
    }
    if (entityType === "bill" && contentType === "public_statement" && !statementFormat) {
      throw new Error("Choose whether the statement is a direct quote or a summary.");
    }

    const photoUrls = await Promise.all(
      files.slice(0, 8).map((file, index) =>
        uploadCommunityPhoto(file, entityType, entityKey, index),
      ),
    );
    const photoUrl = photoUrls[0] || "";

    const db = communityUpdatesDb();
    if (!db) throw new Error("D1 database binding is not configured.");
    await ensureCommunityUpdatesTable(db);

    const result = await db
      .prepare(
        `INSERT INTO community_updates (
          entity_type, entity_key, entity_name, page_url, display_name,
          email, comment, link_url, photo_url, content_type, bill_position,
          statement_format, status, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
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
        contentType,
        billPosition,
        statementFormat,
      )
      .run();
    const updateId = result.meta?.last_row_id || result.meta?.lastRowId || result.lastRowId;
    if (updateId && (comment || taggedPersonIds.length)) {
      await saveCommunityUpdateMentions(updateId, comment, db, taggedPersonIds);
    }
    if (updateId && photoUrls.length) {
      await saveCommunityUpdatePhotos(updateId, photoUrls, db);
    }
    if (updateId && linkUrl) {
      await markCommunityUpdateArchivePending(updateId, linkUrl, db);
      waitUntil(Promise.allSettled([
        captureCommunityUpdateScreenshot({ updateId, sourceUrl: linkUrl, db }),
        getArticlePreview(linkUrl),
      ]));
    }

    if (email) {
      try {
        await sendSubmissionReceivedEmail({
          to: email,
          type: "community-update",
          pageUrl,
          details: communityUpdateEmailDetails({
            entityType,
            entityKey,
            entityName,
            comment,
            linkUrl,
            contentType,
            billPosition,
            statementFormat,
            photoCount: photoUrls.length,
          }),
        });
      } catch (emailError) {
        console.error(emailError?.message || "Unable to send community update received email.");
      }
    }

    return redirectWithMessage(
      request,
      redirectTo,
      "Thanks. Your community update was submitted for review.",
    );
  } catch (error) {
    return redirectWithError(request, redirectTo, error?.message || "Unable to submit community update.");
  }
}

function communityUpdateEmailDetails({
  entityType = "",
  entityKey = "",
  entityName = "",
  comment = "",
  linkUrl = "",
  contentType = "",
  billPosition = "",
  statementFormat = "",
  photoCount = 0,
} = {}) {
  const subject = entityName || [entityType, entityKey].filter(Boolean).join(": ");
  return [
    { label: "Submitted about", value: subject },
    { label: "Update text", value: comment },
    { label: "Contribution type", value: contentTypeLabel(contentType) },
    { label: "Bill position", value: billPositionLabel(billPosition) },
    { label: "Statement wording", value: statementFormatLabel(statementFormat) },
    { label: "Source link", value: linkUrl, href: linkUrl },
    {
      label: "Photos",
      value: photoCount ? `${photoCount} photo${photoCount === 1 ? "" : "s"} uploaded` : "",
    },
  ];
}

function contentTypeLabel(value = "") {
  return {
    community_comment: "Community opinion",
    public_statement: "Candidate or legislator statement",
    correction: "Correction",
    additional_source: "Additional source",
  }[value] || "";
}

function billPositionLabel(value = "") {
  return {
    support: "Support",
    oppose: "Oppose",
    mixed: "Mixed or conditional",
    neutral: "Neutral",
    unclear: "Unclear",
  }[value] || "";
}

function statementFormatLabel(value = "") {
  return {
    direct_quote: "Direct quote",
    summary: "Summary or paraphrase",
  }[value] || "";
}

async function uploadCommunityPhoto(file, entityType, entityKey, index = 0) {
  const bucket = adminR2Bucket();
  if (!bucket) throw new Error("Photo uploads are temporarily unavailable.");

  const key = [
    "community-updates",
    entityType,
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
