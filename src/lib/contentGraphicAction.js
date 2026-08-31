import {
  buildContentGraphicPayload,
  ContentGeneratorError,
  validateContentGraphicRequest,
} from "./contentGenerator.js";
import {
  contentGraphicErrorResponse,
  getRecentContentGraphicEvents,
  renderContentGraphic,
} from "./contentGraphicEvents.js";

const MAX_REQUEST_BYTES = 16_384;

/**
 * @typedef {{ email?: string, role?: string }} ContentGraphicSession
 * @typedef {{ ok: boolean, session?: ContentGraphicSession }} ContentGraphicAuth
 */

/**
 * @param {{
 *   request: Request,
 *   authorize: (request: Request) => Promise<ContentGraphicAuth>,
 *   canGenerate: (session: ContentGraphicSession) => boolean,
 *   db: D1Database,
 *   baseUrl?: string,
 *   fetchImpl?: typeof globalThis.fetch,
 *   timeoutMs?: number,
 * }} options
 */
export async function handleContentGraphicPost({
  request,
  authorize,
  canGenerate,
  db,
  baseUrl,
  fetchImpl = globalThis.fetch,
  timeoutMs,
} = {}) {
  const auth = await authorize(request);
  const access = contentGraphicAccess(auth, canGenerate);
  if (!access.ok) return jsonResponse(access.body, access.status);
  if (!isSameOriginRequest(request)) {
    return jsonResponse({ status: "error", message: "This request must come from NH Deserves Better." }, 403);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return jsonResponse({ status: "error", message: "Send this request as JSON." }, 415);
  }

  let raw;
  try {
    raw = await readSmallJsonBody(request);
  } catch (error) {
    const status = error?.code === "PAYLOAD_TOO_LARGE" ? 413 : 400;
    return jsonResponse({ status: "error", message: error?.message || "Invalid JSON request." }, status);
  }

  const validation = validateContentGraphicRequest(raw);
  if (!validation.ok) {
    return jsonResponse(
      {
        status: "error",
        eventId: validation.data.eventId || "",
        code: "INVALID_PAYLOAD",
        message: "Review the highlighted fields and try again.",
        requestId: "",
        retryable: false,
        fieldErrors: validation.fieldErrors,
      },
      422,
    );
  }

  const payload = buildContentGraphicPayload(validation.data);
  try {
    const event = await renderContentGraphic({
      db,
      data: validation.data,
      payload,
      createdBy: auth.session?.email || "",
      baseUrl,
      fetchImpl,
      timeoutMs,
    });
    return jsonResponse(
      {
        status: "complete",
        eventId: event.eventId,
        rendererId: event.rendererId,
        template: event.template,
        variation: event.variation,
        variationName: event.variationName,
        imageUrl: event.imageUrl,
        sourceId: event.sourceId,
        duplicate: Boolean(event.duplicate),
        width: event.width || 1080,
        height: event.height || 1350,
        createdAt: event.createdAt,
        completedAt: event.completedAt,
        downloadUrl: `/api/admin/content-graphics/${encodeURIComponent(event.eventId)}/download`,
      },
      200,
    );
  } catch (error) {
    const response = contentGraphicErrorResponse(error, validation.data.eventId);
    console.error(JSON.stringify({
      event: "content_graphic_render_failed",
      eventId: validation.data.eventId,
      code: response.code,
      requestId: response.requestId || undefined,
    }));
    const { httpStatus, ...body } = response;
    return jsonResponse(body, httpStatus);
  }
}

/**
 * @param {{
 *   request: Request,
 *   authorize: (request: Request) => Promise<ContentGraphicAuth>,
 *   canGenerate: (session: ContentGraphicSession) => boolean,
 *   db: D1Database,
 * }} options
 */
export async function handleContentGraphicList({
  request,
  authorize,
  canGenerate,
  db,
} = {}) {
  const auth = await authorize(request);
  const access = contentGraphicAccess(auth, canGenerate);
  if (!access.ok) return jsonResponse(access.body, access.status);

  const url = new URL(request.url);
  const entityType = String(url.searchParams.get("entityType") || "").trim().toLowerCase();
  const entityId = String(url.searchParams.get("entityId") || "").trim();
  if (!['candidate', 'legislator'].includes(entityType) || !entityId || entityId.length > 160) {
    return jsonResponse({ status: "error", message: "Choose a valid profile." }, 400);
  }

  try {
    const events = await getRecentContentGraphicEvents({ db, entityType, entityId });
    return jsonResponse({
      status: "ok",
      events: events.map((event) => ({
        eventId: event.eventId,
        rendererId: event.rendererId,
        template: event.template,
        variation: event.variation,
        variationName: event.variationName,
        imageUrl: event.imageUrl,
        sourceId: event.sourceId,
        createdAt: event.createdAt,
        completedAt: event.completedAt,
        downloadUrl: `/api/admin/content-graphics/${encodeURIComponent(event.eventId)}/download`,
      })),
    });
  } catch (error) {
    console.error(JSON.stringify({
      event: "content_graphic_list_failed",
      message: error?.message || "Unknown content graphic list error",
    }));
    return jsonResponse({ status: "error", message: "Unable to load recent graphics." }, 500);
  }
}

/**
 * @param {ContentGraphicAuth} auth
 * @param {(session: ContentGraphicSession) => boolean} canGenerate
 */
export function contentGraphicAccess(auth, canGenerate) {
  if (!auth?.ok || !auth?.session) {
    return {
      ok: false,
      status: 401,
      body: { status: "error", message: "Admin sign-in is required." },
    };
  }
  if (!canGenerate(auth.session)) {
    return {
      ok: false,
      status: 403,
      body: { status: "error", message: "Your admin role cannot create social graphics." },
    };
  }
  return { ok: true, status: 200, body: null };
}

export function isSameOriginRequest(request) {
  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  return origin === expectedOrigin && (!fetchSite || fetchSite === "same-origin");
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function readSmallJsonBody(request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    const error = new ContentGeneratorError("The graphic request is too large.", {
      code: "PAYLOAD_TOO_LARGE",
      status: 413,
    });
    throw error;
  }
  if (!request.body) return {};

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let bytesRead = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytesRead += value.byteLength;
    if (bytesRead > MAX_REQUEST_BYTES) {
      await reader.cancel();
      const error = new ContentGeneratorError("The graphic request is too large.", {
        code: "PAYLOAD_TOO_LARGE",
        status: 413,
      });
      throw error;
    }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();
  try {
    return JSON.parse(body || "{}");
  } catch {
    throw new ContentGeneratorError("The graphic request contains invalid JSON.", {
      code: "INVALID_JSON",
      status: 400,
    });
  }
}
