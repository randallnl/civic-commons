export const prerender = false;

import { env } from "cloudflare:workers";
import { getBillDetail } from "../../../lib/billsApi";
import {
  BILL_SHARE_FALLBACK,
  BILL_SHARE_HEIGHT,
  BILL_SHARE_ORIGIN,
  BILL_SHARE_WIDTH,
  billShareStorageKey,
  normalizeBillShareCode,
  validBillShareCode,
  validBillShareYear,
} from "../../../lib/billSharePreview";

const CACHE_CONTROL = "public, max-age=31536000, immutable";

export async function GET({ params, request }) {
  const billCode = normalizeBillShareCode(params.bill);
  const year = validBillShareYear(new URL(request.url).searchParams.get("year"));
  if (!validBillShareCode(billCode) || !year) return fallbackImage();

  const bucket = env.r2_bucket;
  const browser = env.BROWSER;
  if (!bucket || !browser?.quickAction) return fallbackImage();

  try {
    const data = await getBillDetail(billCode, { year });
    if (!data?.bill) return fallbackImage();

    const revision =
      data.bill.updated_at ||
      data.bill.last_updated ||
      data.bill.statusdate ||
      year;
    const key = billShareStorageKey(billCode, year, revision);
    const cached = await bucket.get(key);
    if (cached) {
      return new Response(cached.body, { headers: imageHeaders(cached.httpEtag) });
    }

    const targetUrl = new URL(
      `/bills/${encodeURIComponent(billCode)}`,
      BILL_SHARE_ORIGIN,
    );
    targetUrl.searchParams.set("year", year);
    targetUrl.searchParams.set("share-preview", "1");

    const response = await browser.quickAction("screenshot", {
      url: targetUrl.toString(),
      actionTimeout: 25_000,
      gotoOptions: { timeout: 20_000, waitUntil: "domcontentloaded" },
      waitForSelector: {
        selector: ".bill-share-shell",
        visible: true,
        timeout: 12_000,
      },
      waitForTimeout: 750,
      viewport: {
        width: BILL_SHARE_WIDTH,
        height: BILL_SHARE_HEIGHT,
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
      event: "bill_share_preview_failed",
      billCode,
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
    headers: { location: BILL_SHARE_FALLBACK, "cache-control": "no-store" },
  });
}
