export const prerender = false;

import { ADMIN_COOKIE } from "../../lib/adminAuth";
import {
  isLikelyCrawler,
  recordProfileView,
} from "../../lib/profileAnalytics";

const MAX_BODY_BYTES = 2048;
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,158}[a-z0-9])?$/;
const VISITOR_ID_PATTERN = /^[A-Za-z0-9_-]{16,100}$/;

export async function POST({ request }) {
  if (!isSameOriginRequest(request)) return new Response(null, { status: 403 });
  if (hasAdminCookie(request)) return noContent();
  if (isLikelyCrawler(request.headers.get("user-agent"))) return noContent();

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) return new Response(null, { status: 413 });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return new Response(null, { status: 415 });
  }

  try {
    const payload = await readSmallJsonBody(request);
    const slug = String(payload?.slug || "").trim().toLowerCase();
    const visitorId = String(payload?.visitorId || "").trim();
    if (!SLUG_PATTERN.test(slug) || !VISITOR_ID_PATTERN.test(visitorId)) {
      return new Response(null, { status: 400 });
    }

    await recordProfileView({ slug, visitorId });
  } catch (error) {
    console.error(JSON.stringify({
      event: "profile_view_record_failed",
      message: error?.message || "Unknown profile analytics error",
    }));
  }

  return noContent();
}

function isSameOriginRequest(request) {
  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  return origin === expectedOrigin && (!fetchSite || fetchSite === "same-origin");
}

function hasAdminCookie(request) {
  const cookie = request.headers.get("cookie") || "";
  return cookie
    .split(";")
    .some((part) => part.trim().startsWith(`${ADMIN_COOKIE}=`));
}

function noContent() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

async function readSmallJsonBody(request) {
  if (!request.body) return {};

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let bytesRead = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytesRead += value.byteLength;
    if (bytesRead > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error("Profile analytics payload is too large.");
    }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();
  return JSON.parse(body || "{}");
}
