export const prerender = false;

import { env } from "cloudflare:workers";
import {
  communityUpdateShareStorageKey,
  PROFILE_SHARE_FALLBACK,
  PROFILE_SHARE_HEIGHT,
  PROFILE_SHARE_ORIGIN,
  PROFILE_SHARE_WIDTH,
  profileShareStorageKey,
  validCommunityUpdateId,
  validProfileSlug,
} from "../../../lib/profileSharePreview";
import { ensureCommunityUpdatesTable } from "../../../lib/communityUpdates";

const CACHE_CONTROL = "public, max-age=31536000, immutable";

export async function GET({ params, request }) {
  const slug = params.slug;
  if (!validProfileSlug(slug)) return new Response("Profile not found.", { status: 404 });
  const updateId = validCommunityUpdateId(new URL(request.url).searchParams.get("update"));

  const db = env.d1_db;
  const bucket = env.r2_bucket;
  const browser = env.BROWSER;
  if (!db || !bucket || !browser?.quickAction) return fallbackImage();

  try {
    const profile = await db.prepare(
      `SELECT id, slug, gc_personid, employeeno, filer_entity_number, updated_at
       FROM d1_people
       WHERE slug = ?
       LIMIT 1`,
    )
      .bind(slug).first();
    if (!profile) return fallbackImage();

    const update = updateId
      ? await approvedCommunityUpdateForProfile(db, profile, updateId)
      : null;
    if (updateId && !update) return fallbackImage();

    const key = update
      ? communityUpdateShareStorageKey(slug, updateId, update.updated_at || update.created_at)
      : profileShareStorageKey(slug, profile.updated_at);
    const cached = await bucket.get(key);
    if (cached) {
      return new Response(cached.body, {
        headers: imageHeaders(cached.httpEtag),
      });
    }

    // The destination is constructed only from a validated profile slug and an
    // approved update that belongs to that profile. Never accept a target URL.
    const targetUrl = new URL(`/people/${slug}`, PROFILE_SHARE_ORIGIN);
    targetUrl.searchParams.set("share-preview", update ? "update" : "1");
    if (update) {
      targetUrl.searchParams.set("update", String(updateId));
      targetUrl.hash = `community-update-${updateId}`;
    }
    const waitForSelector = update
      ? `.community-update-share-shell #community-update-${updateId}`
      : ".profile-hero";
    const response = await browser.quickAction("screenshot", {
      url: targetUrl.toString(),
      actionTimeout: 25_000,
      gotoOptions: { timeout: 20_000, waitUntil: "domcontentloaded" },
      waitForSelector: { selector: waitForSelector, visible: true, timeout: 12_000 },
      waitForTimeout: 1_000,
      viewport: {
        width: PROFILE_SHARE_WIDTH,
        height: PROFILE_SHARE_HEIGHT,
        deviceScaleFactor: 1,
      },
      screenshotOptions: { type: "jpeg", quality: 82, fullPage: false },
    });
    if (!response.ok) throw new Error(`Screenshot returned ${response.status}`);

    // A fixed-size JPEG is bounded; buffer it once for both R2 and this response.
    const image = await response.arrayBuffer();
    if (!image.byteLength) throw new Error("Screenshot was empty");
    await bucket.put(key, image, {
      httpMetadata: { contentType: "image/jpeg", cacheControl: CACHE_CONTROL },
    });

    return new Response(image, { headers: imageHeaders() });
  } catch (error) {
    console.error(JSON.stringify({
      event: "profile_share_preview_failed",
      slug,
      updateId: updateId || undefined,
      error: String(error?.message || error),
    }));
    return fallbackImage();
  }
}

async function approvedCommunityUpdateForProfile(db, profile, updateId) {
  await ensureCommunityUpdatesTable(db);
  const representativeKeys = [
    profile.gc_personid,
    profile.employeeno,
    profile.id,
    profile.slug,
  ].map(String);
  const candidateKeys = [
    profile.filer_entity_number || "",
    profile.slug,
  ];

  return db
    .prepare(
      `SELECT id, created_at, updated_at
       FROM community_updates
       WHERE id = ?
         AND status = 'approved'
         AND (
           (entity_type = 'representative' AND entity_key IN (?, ?, ?, ?))
           OR (entity_type = 'candidate' AND entity_key IN (?, ?))
         )
       LIMIT 1`,
    )
    .bind(updateId, ...representativeKeys, ...candidateKeys)
    .first();
}

function imageHeaders(etag) {
  const headers = new Headers({
    "content-type": "image/jpeg",
    "cache-control": CACHE_CONTROL,
    "x-content-type-options": "nosniff",
  });
  if (etag) headers.set("etag", etag);
  return headers;
}

function fallbackImage() {
  return new Response(null, {
    status: 302,
    headers: { location: PROFILE_SHARE_FALLBACK, "cache-control": "no-store" },
  });
}
