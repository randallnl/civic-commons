export const prerender = false;

import { env } from "cloudflare:workers";
import {
  PROFILE_SHARE_FALLBACK,
  PROFILE_SHARE_HEIGHT,
  PROFILE_SHARE_ORIGIN,
  PROFILE_SHARE_WIDTH,
  profileShareStorageKey,
  validProfileSlug,
} from "../../../lib/profileSharePreview";

const CACHE_CONTROL = "public, max-age=31536000, immutable";

export async function GET({ params }) {
  const slug = params.slug;
  if (!validProfileSlug(slug)) return new Response("Profile not found.", { status: 404 });

  const db = env.d1_db;
  const bucket = env.r2_bucket;
  const browser = env.BROWSER;
  if (!db || !bucket || !browser?.quickAction) return fallbackImage();

  try {
    const profile = await db.prepare("SELECT updated_at FROM d1_people WHERE slug = ? LIMIT 1")
      .bind(slug).first();
    if (!profile) return fallbackImage();

    const key = profileShareStorageKey(slug, profile.updated_at);
    const cached = await bucket.get(key);
    if (cached) {
      return new Response(cached.body, {
        headers: imageHeaders(cached.httpEtag),
      });
    }

    // The URL is constructed solely from a validated, existing profile slug.
    // Do not accept a destination URL from a request parameter here.
    const response = await browser.quickAction("screenshot", {
      url: `${PROFILE_SHARE_ORIGIN}/people/${slug}?share-preview=1`,
      actionTimeout: 25_000,
      gotoOptions: { timeout: 20_000, waitUntil: "domcontentloaded" },
      waitForSelector: { selector: ".profile-hero", visible: true, timeout: 12_000 },
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
      error: String(error?.message || error),
    }));
    return fallbackImage();
  }
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
