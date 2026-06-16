export const prerender = false;

import { env } from "cloudflare:workers";

const CACHE_CONTROL = "public, max-age=86400";

export async function GET({ params }) {
  const key = sanitizeKey(params.key);

  if (!key) {
    return new Response("Asset key is required.", { status: 400 });
  }

  const bucket = env["organization-assets"];

  if (!bucket) {
    return new Response("Organization asset bucket is not configured.", {
      status: 503,
    });
  }

  const object = await bucket.get(key);

  if (!object) {
    return new Response("Asset not found.", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", headers.get("cache-control") || CACHE_CONTROL);

  if (!headers.has("content-type")) {
    headers.set("content-type", contentTypeFor(key));
  }

  return new Response(object.body, { headers });
}

function sanitizeKey(value = "") {
  const key = String(value).trim();

  if (
    !key ||
    key.startsWith("/") ||
    key.includes("..") ||
    key.includes("\\")
  ) {
    return "";
  }

  return key;
}

function contentTypeFor(key = "") {
  const extension = key.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "avif":
      return "image/avif";
    case "gif":
      return "image/gif";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "svg":
      return "image/svg+xml";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}
