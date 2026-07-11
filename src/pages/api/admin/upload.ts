export const prerender = false;

import { adminR2Bucket, requireAdmin } from "../../../lib/adminAuth";

export async function POST({ request }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const bucket = adminR2Bucket();
    if (!bucket) throw new Error("R2 bucket binding is not configured.");

    const form = await request.formData();
    const key = sanitizeKey(form.get("key"));
    const file = form.get("file");

    if (!key) throw new Error("A valid R2 key is required.");
    if (!file || typeof file === "string" || !file.size) {
      throw new Error("Image file is required.");
    }

    const contentType = file.type || contentTypeFor(key);

    await bucket.put(key, file.stream(), {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=86400",
      },
    });

    const url = new URL("/admin", request.url);
    url.searchParams.set("message", `Uploaded ${key}`);
    url.searchParams.set("imageUrl", `/api/organization-assets/${encodeAssetKey(key)}`);
    return Response.redirect(url, 303);
  } catch (error) {
    const url = new URL("/admin", request.url);
    url.searchParams.set("error", error?.message || "Unable to upload image.");
    return Response.redirect(url, 303);
  }
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

function encodeAssetKey(key = "") {
  return key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
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
