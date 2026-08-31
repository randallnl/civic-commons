export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import {
  canEditProfiles,
  forbiddenAdminResponse,
  requireAdmin,
} from "../../../../../lib/adminAuth";
import { getContentGraphicEvent } from "../../../../../lib/contentGraphicEvents";
import { CONTENT_GENERATOR_PRODUCTION_URL } from "../../../../../lib/contentGenerator";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const GET: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  if (!canEditProfiles(auth.session)) return forbiddenAdminResponse();

  const eventId = String(params.eventId || "").trim().toLowerCase();
  if (!UUID_PATTERN.test(eventId)) return new Response("Invalid graphic identifier.", { status: 400 });

  const event = await getContentGraphicEvent(eventId, env.d1_db);
  if (!event?.imageUrl || event.status !== "complete") {
    return new Response("Graphic not found.", { status: 404 });
  }

  const baseUrl = new URL(env.CONTENT_GENERATOR_BASE_URL || CONTENT_GENERATOR_PRODUCTION_URL);
  const assetUrl = new URL(event.imageUrl);
  if (assetUrl.origin !== baseUrl.origin) {
    return new Response("The stored graphic URL is not served by the configured renderer.", { status: 502 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("content-graphic-download-timeout"), 20_000);
  try {
    const response = await fetch(assetUrl, {
      headers: { Accept: "image/png,image/*;q=0.8" },
      signal: controller.signal,
    });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.toLowerCase().startsWith("image/")) {
      return new Response("Unable to download the generated graphic.", { status: 502 });
    }
    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="nhdb-${event.template}-${event.eventId}.png"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("The generated graphic download timed out.", { status: 504 });
  } finally {
    clearTimeout(timeout);
  }
};
