export const prerender = false;

import { env } from "cloudflare:workers";
import { getRollCallVotes } from "../../../../lib/billsApi";
import {
  normalizeRollCallBillCode,
  ROLL_CALL_SHARE_FALLBACK,
  ROLL_CALL_SHARE_HEIGHT,
  ROLL_CALL_SHARE_ORIGIN,
  ROLL_CALL_SHARE_WIDTH,
  rollCallShareStorageKey,
  validRollCallBillCode,
  validRollCallSequence,
  validRollCallYear,
} from "../../../../lib/rollCallSharePreview";

const CACHE_CONTROL = "public, max-age=31536000, immutable";

export async function GET({ params, request }) {
  const billCode = normalizeRollCallBillCode(params.bill);
  const sequence = validRollCallSequence(params.sequence);
  const year = validRollCallYear(new URL(request.url).searchParams.get("year"));
  if (!validRollCallBillCode(billCode) || !sequence || !year) return fallbackImage();

  const bucket = env.r2_bucket;
  const browser = env.BROWSER;
  if (!bucket || !browser?.quickAction) return fallbackImage();

  try {
    const data = await getRollCallVotes(billCode, sequence, { year });
    if (!data?.bill || !data?.rollCall) return fallbackImage();

    const revision =
      data.rollCall.votedate ||
      data.rollCall.updated_at ||
      data.bill.updated_at ||
      data.bill.last_updated ||
      year;
    const key = rollCallShareStorageKey(billCode, sequence, year, revision);
    const cached = await bucket.get(key);
    if (cached) {
      return new Response(cached.body, { headers: imageHeaders(cached.httpEtag) });
    }

    const targetUrl = new URL(
      `/bills/${encodeURIComponent(billCode)}/roll-calls/${encodeURIComponent(sequence)}`,
      ROLL_CALL_SHARE_ORIGIN,
    );
    targetUrl.searchParams.set("year", year);
    targetUrl.searchParams.set("share-preview", "1");

    const response = await browser.quickAction("screenshot", {
      url: targetUrl.toString(),
      actionTimeout: 25_000,
      gotoOptions: { timeout: 20_000, waitUntil: "domcontentloaded" },
      waitForSelector: {
        selector: ".roll-call-share-shell",
        visible: true,
        timeout: 12_000,
      },
      waitForTimeout: 750,
      viewport: {
        width: ROLL_CALL_SHARE_WIDTH,
        height: ROLL_CALL_SHARE_HEIGHT,
        deviceScaleFactor: 1,
      },
      screenshotOptions: { type: "jpeg", quality: 84, fullPage: false },
    });
    if (!response.ok) throw new Error(`Screenshot returned ${response.status}`);

    const image = await response.arrayBuffer();
    if (!image.byteLength) throw new Error("Screenshot was empty");
    await bucket.put(key, image, {
      httpMetadata: { contentType: "image/jpeg", cacheControl: CACHE_CONTROL },
    });

    return new Response(image, { headers: imageHeaders() });
  } catch (error) {
    console.error(JSON.stringify({
      event: "roll_call_share_preview_failed",
      billCode,
      sequence,
      year,
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
    headers: { location: ROLL_CALL_SHARE_FALLBACK, "cache-control": "no-store" },
  });
}
