export const prerender = false;

import { env } from "cloudflare:workers";
import { getReportDownload } from "../../lib/reportDownloads";

const CACHE_CONTROL = "public, max-age=3600";

export async function GET({ params }) {
  let download;

  try {
    download = await getReportDownload(params.slug);
  } catch (error) {
    console.error(JSON.stringify({
      event: "report_download_lookup_failed",
      slug: params.slug,
      message: error instanceof Error ? error.message : String(error),
    }));
    return new Response("Download metadata is unavailable.", { status: 503 });
  }

  if (!download) {
    return new Response("Download not found.", { status: 404 });
  }

  const bucket = env["organization-assets"];
  if (!bucket) {
    return new Response("Download storage is not configured.", { status: 503 });
  }

  const object = await bucket.get(String(download.object_key || ""));
  if (!object) {
    console.error(JSON.stringify({
      event: "report_download_object_missing",
      slug: download.slug,
      objectKey: download.object_key,
    }));
    return new Response("Download file is unavailable.", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", headers.get("cache-control") || CACHE_CONTROL);
  headers.set(
    "content-disposition",
    `attachment; filename="${safeFilename(download.original_filename)}"`,
  );
  headers.set(
    "content-type",
    String(download.content_type || headers.get("content-type") || "application/octet-stream"),
  );
  headers.set("content-length", String(object.size));
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-file-sha256", String(download.sha256 || ""));

  return new Response(object.body, { headers });
}

function safeFilename(value = "download") {
  return String(value)
    .replace(/[\r\n"\\/]/g, "-")
    .replace(/[^\x20-\x7e]/g, "-")
    .trim() || "download";
}
