import {
  ContentGeneratorError,
  contentGraphicSourceId,
  createContentGeneratorClient,
  mapRendererFieldErrors,
} from "./contentGenerator.js";

const TABLE_SQL = `CREATE TABLE IF NOT EXISTS content_graphic_events (
  local_event_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('candidate', 'legislator')),
  entity_id TEXT NOT NULL,
  candidate_id TEXT,
  legislator_id TEXT,
  template_slug TEXT NOT NULL,
  renderer_render_id TEXT,
  variation_id TEXT,
  variation_name TEXT,
  image_url TEXT,
  source_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  request_json TEXT NOT NULL,
  renderer_duplicate INTEGER NOT NULL DEFAULT 0,
  error_summary TEXT,
  renderer_request_id TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
)`;

export async function ensureContentGraphicEventsTable(db) {
  if (!db) throw new Error("D1 database binding is not configured.");
  await db.prepare(TABLE_SQL).run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_content_graphic_events_entity
       ON content_graphic_events(entity_type, entity_id, created_at DESC)`,
    )
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_content_graphic_events_status
       ON content_graphic_events(status, updated_at DESC)`,
    )
    .run();
}

export async function renderContentGraphic({
  db,
  data,
  payload,
  createdBy = "",
  baseUrl,
  fetchImpl = globalThis.fetch,
  timeoutMs,
} = {}) {
  if (!db) throw new Error("D1 database binding is not configured.");
  await ensureContentGraphicEventsTable(db);

  const sourceId = contentGraphicSourceId(data.template, data.eventId);
  const requestJson = JSON.stringify(payload);
  const insertResult = await db
    .prepare(
      `INSERT OR IGNORE INTO content_graphic_events (
         local_event_id, entity_type, entity_id, candidate_id, legislator_id,
         template_slug, source_id, status, request_json, created_by,
         created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    )
    .bind(
      data.eventId,
      data.entityType,
      data.entityId,
      data.entityType === "candidate" ? data.entityId : null,
      data.entityType === "legislator" ? data.entityId : null,
      data.template,
      sourceId,
      requestJson,
      createdBy,
    )
    .run();
  const isNewEvent = Number(insertResult.meta?.changes ?? insertResult.changes ?? 0) > 0;

  const existing = await getContentGraphicEvent(data.eventId, db);
  assertEventMatches(existing, data, sourceId);

  if (existing.status === "complete" && existing.imageUrl) {
    return { ...existing, duplicate: true, localDuplicate: true };
  }

  let renderPayload = payload;
  if (shouldReuseContentGraphicPayload(existing.status, isNewEvent)) {
    renderPayload = contentGraphicRetryPayload(existing.status, existing.requestJson, payload);
  } else {
    await db
      .prepare(
        `UPDATE content_graphic_events
         SET request_json = ?, status = 'pending', error_summary = NULL,
             renderer_request_id = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE local_event_id = ?`,
      )
      .bind(requestJson, data.eventId)
      .run();
  }

  const client = createContentGeneratorClient({ baseUrl, fetchImpl, timeoutMs });
  try {
    const render = await client.render(renderPayload);
    await db
      .prepare(
        `UPDATE content_graphic_events
         SET renderer_render_id = ?, variation_id = ?, variation_name = ?,
             image_url = ?, status = 'complete', renderer_duplicate = ?,
             error_summary = NULL, renderer_request_id = NULL,
             completed_at = COALESCE(?, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
         WHERE local_event_id = ?`,
      )
      .bind(
        render.id,
        render.variation || "",
        render.variationName || "",
        render.image_url,
        render.duplicate ? 1 : 0,
        render.completed_at || null,
        data.eventId,
      )
      .run();

    const saved = await getContentGraphicEvent(data.eventId, db);
    return {
      ...saved,
      width: Number(render.width || 1080),
      height: Number(render.height || 1350),
      duplicate: Boolean(render.duplicate),
      localDuplicate: false,
    };
  } catch (error) {
    const rendererError = normalizeRendererError(error);
    const status = rendererError.code === "INVALID_PAYLOAD"
      ? "validation_error"
      : rendererError.retryable
        ? "uncertain"
        : "renderer_error";
    await db
      .prepare(
        `UPDATE content_graphic_events
         SET status = ?, error_summary = ?, renderer_request_id = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE local_event_id = ?`,
      )
      .bind(status, rendererError.message, rendererError.requestId || null, data.eventId)
      .run();
    throw rendererError;
  }
}

export function contentGraphicRetryPayload(status, requestJson, nextPayload) {
  if (!['uncertain', 'pending'].includes(status)) return nextPayload;
  return parseStoredPayload(requestJson, nextPayload);
}

export function shouldReuseContentGraphicPayload(status, isNewEvent = false) {
  return status === "uncertain" || (status === "pending" && !isNewEvent);
}

export async function getContentGraphicEvent(eventId, db) {
  if (!db) throw new Error("D1 database binding is not configured.");
  await ensureContentGraphicEventsTable(db);
  const row = await db
    .prepare(
      `SELECT local_event_id, entity_type, entity_id, candidate_id, legislator_id,
              template_slug, renderer_render_id, variation_id, variation_name,
              image_url, source_id, status, request_json, renderer_duplicate,
              error_summary, renderer_request_id, created_by, created_at,
              updated_at, completed_at
       FROM content_graphic_events
       WHERE local_event_id = ?
       LIMIT 1`,
    )
    .bind(String(eventId || ""))
    .first();
  return row ? normalizeEventRow(row) : null;
}

export async function getRecentContentGraphicEvents({
  db,
  entityType,
  entityId,
  limit = 8,
} = {}) {
  if (!db) throw new Error("D1 database binding is not configured.");
  await ensureContentGraphicEventsTable(db);
  const safeLimit = Math.max(1, Math.min(Number(limit) || 8, 20));
  const result = await db
    .prepare(
      `SELECT local_event_id, entity_type, entity_id, candidate_id, legislator_id,
              template_slug, renderer_render_id, variation_id, variation_name,
              image_url, source_id, status, request_json, renderer_duplicate,
              error_summary, renderer_request_id, created_by, created_at,
              updated_at, completed_at
       FROM content_graphic_events
       WHERE entity_type = ? AND entity_id = ? AND status = 'complete'
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .bind(entityType, entityId, safeLimit)
    .all();
  return (result.results || []).map(normalizeEventRow);
}

export function contentGraphicErrorResponse(error, eventId = "") {
  const rendererError = normalizeRendererError(error);
  const fieldErrors = mapRendererFieldErrors(rendererError.details);
  return {
    status: "error",
    eventId,
    code: rendererError.code,
    message: rendererError.message,
    requestId: rendererError.requestId,
    retryable: rendererError.retryable,
    fieldErrors,
    httpStatus: rendererError.status,
  };
}

export function normalizeEventRow(row = {}) {
  return {
    eventId: row.local_event_id || row.eventId || "",
    entityType: row.entity_type || row.entityType || "",
    entityId: row.entity_id || row.entityId || "",
    candidateId: row.candidate_id || row.candidateId || "",
    legislatorId: row.legislator_id || row.legislatorId || "",
    template: row.template_slug || row.template || "",
    rendererId: row.renderer_render_id || row.rendererId || "",
    variation: row.variation_id || row.variation || "",
    variationName: row.variation_name || row.variationName || "",
    imageUrl: row.image_url || row.imageUrl || "",
    sourceId: row.source_id || row.sourceId || "",
    status: row.status || "pending",
    requestJson: row.request_json || row.requestJson || "{}",
    duplicate: Boolean(row.renderer_duplicate || row.duplicate),
    errorSummary: row.error_summary || row.errorSummary || "",
    requestId: row.renderer_request_id || row.requestId || "",
    createdBy: row.created_by || row.createdBy || "",
    createdAt: row.created_at || row.createdAt || "",
    updatedAt: row.updated_at || row.updatedAt || "",
    completedAt: row.completed_at || row.completedAt || "",
  };
}

function assertEventMatches(existing, data, sourceId) {
  if (!existing) throw new Error("Unable to create the local content event.");
  if (
    existing.entityType !== data.entityType ||
    existing.entityId !== data.entityId ||
    existing.template !== data.template ||
    existing.sourceId !== sourceId
  ) {
    throw new ContentGeneratorError(
      "This content event identifier is already assigned to another render.",
      { code: "EVENT_CONFLICT", status: 409 },
    );
  }
}

function parseStoredPayload(requestJson, fallback) {
  try {
    const stored = JSON.parse(requestJson || "{}");
    return stored?.source?.id ? stored : fallback;
  } catch {
    return fallback;
  }
}

function normalizeRendererError(error) {
  if (error instanceof ContentGeneratorError) return error;
  return new ContentGeneratorError(
    error?.message || "Unable to generate the social graphic.",
    { code: "CONTENT_GRAPHIC_ERROR", status: 500, retryable: false },
  );
}
