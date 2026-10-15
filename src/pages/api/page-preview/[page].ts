export const prerender = false;

import { env } from "cloudflare:workers";
import {
  PAGE_SHARE_FALLBACK,
  PAGE_SHARE_HEIGHT,
  PAGE_SHARE_WIDTH,
  pageShareConfig,
  pageShareStorageKey,
  pageShareTargetUrl,
  validPageShareKey,
} from "../../../lib/pageSharePreview";

const CACHE_CONTROL = "public, max-age=31536000, immutable";

export async function GET({ params }) {
  const pageKey = params.page;
  if (!validPageShareKey(pageKey)) {
    return new Response("Page preview not found.", { status: 404 });
  }

  const bucket = env.r2_bucket;
  const browser = env.BROWSER;
  if (!bucket || !browser?.quickAction) return fallbackImage();

  const config = pageShareConfig(pageKey);
  const key = pageShareStorageKey(pageKey);

  try {
    const cached = await bucket.get(key);
    if (cached) {
      return new Response(cached.body, { headers: imageHeaders(cached.httpEtag) });
    }

    const response = await browser.quickAction("screenshot", {
      url: pageShareTargetUrl(pageKey),
      actionTimeout: 25_000,
      cacheTTL: 0,
      gotoOptions: { timeout: 20_000, waitUntil: "domcontentloaded" },
      waitForSelector: {
        selector: config.selector,
        visible: true,
        timeout: 12_000,
      },
      waitForTimeout: 750,
      viewport: {
        width: PAGE_SHARE_WIDTH,
        height: PAGE_SHARE_HEIGHT,
        deviceScaleFactor: 1,
      },
      screenshotOptions: { type: "jpeg", quality: 84, fullPage: false },
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Screenshot returned ${response.status}`);
    }

    const image = await response.arrayBuffer();
    if (!image.byteLength) throw new Error("Screenshot was empty");

    await bucket.put(key, image, {
      httpMetadata: { contentType: "image/jpeg", cacheControl: CACHE_CONTROL },
    });

    return new Response(image, { headers: imageHeaders() });
  } catch (error) {
    console.error(JSON.stringify({
      event: "page_share_preview_failed",
      pageKey,
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
    headers: { location: PAGE_SHARE_FALLBACK, "cache-control": "no-store" },
  });
}
