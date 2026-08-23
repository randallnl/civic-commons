import { env } from "cloudflare:workers";
import { adminR2Bucket } from "./adminAuth";
import { communityUpdatesDb } from "./communityUpdates";

const ARCHIVE_PREFIX = "community-update-archives";

export async function markCommunityUpdateArchivePending(
  updateId,
  sourceUrl,
  db = communityUpdatesDb(),
) {
  if (!db || !updateId || !sourceUrl) return;

  await db
    .prepare(
      `UPDATE community_updates
       SET archive_source_url = ?,
           archive_status = 'pending',
           archive_error = NULL
       WHERE id = ?`,
    )
    .bind(sourceUrl, updateId)
    .run();
}

export async function captureCommunityUpdateScreenshot({
  updateId,
  sourceUrl,
  db = communityUpdatesDb(),
  bucket = adminR2Bucket(),
  browser = env.BROWSER,
} = {}) {
  if (!db || !updateId || !sourceUrl) return null;

  try {
    validateArchiveUrl(sourceUrl);
    if (!bucket) throw new Error("R2 archive storage is not configured.");
    if (!browser?.quickAction) throw new Error("Browser Rendering is not configured.");

    await db
      .prepare(
        `UPDATE community_updates
         SET archive_status = 'capturing', archive_error = NULL
         WHERE id = ?`,
      )
      .bind(updateId)
      .run();

    const response = await browser.quickAction("screenshot", {
      url: sourceUrl,
      actionTimeout: 20_000,
      gotoOptions: {
        timeout: 15_000,
        waitUntil: "domcontentloaded",
      },
      waitForTimeout: 1_000,
      viewport: {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
      },
      screenshotOptions: {
        type: "jpeg",
        quality: 76,
        fullPage: true,
        optimizeForSpeed: true,
      },
      scrollPage: true,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Screenshot capture returned HTTP ${response.status}.`);
    }

    const key = `${ARCHIVE_PREFIX}/${updateId}/${Date.now()}-submitted-page.jpg`;
    await bucket.put(key, response.body, {
      httpMetadata: {
        contentType: "image/jpeg",
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: {
        communityUpdateId: String(updateId),
        sourceUrl: sourceUrl.slice(0, 1024),
      },
    });

    const screenshotUrl = publicArchiveUrl(key);
    await db
      .prepare(
        `UPDATE community_updates
         SET archive_screenshot_url = ?,
             archive_status = 'complete',
             archive_error = NULL,
             archived_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .bind(screenshotUrl, updateId)
      .run();

    return screenshotUrl;
  } catch (error) {
    const message = archiveErrorMessage(error);
    await db
      .prepare(
        `UPDATE community_updates
         SET archive_status = 'failed', archive_error = ?
         WHERE id = ?`,
      )
      .bind(message, updateId)
      .run();
    console.error(JSON.stringify({
      event: "community_update_archive_failed",
      updateId,
      sourceUrl,
      error: message,
    }));
    return null;
  }
}

function validateArchiveUrl(value = "") {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only public HTTP or HTTPS pages can be archived.");
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname === "0.0.0.0" ||
    hostname === "::" ||
    hostname === "::1" ||
    isPrivateIpv4(hostname) ||
    /^(?:fc|fd|fe8|fe9|fea|feb)/i.test(hostname)
  ) {
    throw new Error("Private or local pages cannot be archived.");
  }
}

function isPrivateIpv4(hostname = "") {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    parts[0] === 0 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

function publicArchiveUrl(key = "") {
  const base =
    stringBinding(env.PHOTO_PUBLIC_BASE) ||
    stringBinding(env.PHOTOS_PUBLIC_BASE) ||
    "https://photos.nhdeservesbetter.com";
  return `${base.replace(/\/+$/, "")}/${encodeAssetKey(key)}`;
}

function stringBinding(binding) {
  return typeof binding === "string" ? binding.trim() : "";
}

function encodeAssetKey(key = "") {
  return key.split("/").map((part) => encodeURIComponent(part)).join("/");
}

function archiveErrorMessage(error) {
  return String(error?.message || "Unable to archive the submitted page.")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}
