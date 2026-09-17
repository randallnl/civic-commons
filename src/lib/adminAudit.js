const AUDITABLE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const EXCLUDED_PATHS = new Set(["/api/admin/request-login"]);
const MAX_METADATA_BYTES = 32_768;
const TARGET_FIELDS = [
  "entityKey", "id", "personId", "personid", "filerEntityNumber",
  "organizationSlug", "candidateSlug", "articleId", "slug", "eventId", "bill", "condensedbillno",
];

export function shouldAuditAdminRequest(request) {
  const path = new URL(request.url).pathname;
  return path.startsWith("/api/admin/") &&
    AUDITABLE_METHODS.has(request.method.toUpperCase()) &&
    !EXCLUDED_PATHS.has(path);
}

export async function adminAuditMetadata(request) {
  const path = new URL(request.url).pathname;
  const endpoint = path.slice("/api/admin/".length).replace(/\/.*/, "");
  const fallback = { action: `admin.${safeToken(endpoint) || "unknown"}`, targetType: "", targetId: "" };
  const contentType = request.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.startsWith("application/x-www-form-urlencoded") &&
      !contentType.startsWith("application/json")) return fallback;
  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader && Number(lengthHeader) > MAX_METADATA_BYTES) return fallback;

  let values;
  try {
    const body = await readBoundedBody(request.clone());
    if (!body) return fallback;
    if (contentType.startsWith("application/x-www-form-urlencoded")) {
      values = new URLSearchParams(body);
    } else if (contentType.startsWith("application/json")) {
      const raw = JSON.parse(body);
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fallback;
      values = { get: (key) => raw[key] };
    }
  } catch {
    return fallback;
  }

  const actionValue = safeToken(
    values.get("profileAction") || values.get("workflowAction") || values.get("action") || values.get("scope"),
  );
  const targetType = safeToken(values.get("entityType") || values.get("type") || endpoint);
  const targetId = TARGET_FIELDS.map((field) => safeIdentifier(values.get(field))).find(Boolean) || "";
  return {
    action: `${fallback.action}${actionValue ? `.${actionValue}` : ""}`,
    targetType,
    targetId,
  };
}

async function readBoundedBody(request) {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) return text + decoder.decode();
    bytes += value.byteLength;
    if (bytes > MAX_METADATA_BYTES) {
      void reader.cancel().catch(() => {});
      return "";
    }
    text += decoder.decode(value, { stream: true });
  }
}

export function adminAuditOutcome(response) {
  if (response.status === 401 || response.status === 403) return "denied";
  if (response.status >= 400) return "error";
  const location = response.headers.get("location");
  if (location && new URL(location, "https://nhdeservesbetter.com").searchParams.has("error")) {
    return "error";
  }
  return "success";
}

function safeToken(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 48);
}

function safeIdentifier(value) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).trim().replace(/[^a-zA-Z0-9_.:-]/g, "").slice(0, 120);
}

export async function ensureAdminAuditLog(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS admin_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor_email TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    outcome TEXT NOT NULL CHECK (outcome IN ('success', 'error', 'denied')),
    http_status INTEGER NOT NULL,
    request_path TEXT NOT NULL
  )`).run();
}

export async function recordAdminAudit(db, { session, request, metadata, outcome, httpStatus }) {
  await db.prepare(`INSERT INTO admin_audit_log
    (actor_email, actor_role, action, target_type, target_id, outcome, http_status, request_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      session.email, session.role, metadata.action, metadata.targetType || null,
      metadata.targetId || null, outcome, httpStatus, new URL(request.url).pathname,
    ).run();
}

export async function getAdminAuditLog(db, { actor = "", area = "", outcome = "", before = 0 } = {}) {
  const clauses = [];
  const params = [];
  if (actor) { clauses.push("actor_email = ? COLLATE NOCASE"); params.push(actor.slice(0, 254)); }
  if (area) { clauses.push("request_path = ?"); params.push(`/api/admin/${area}`); }
  if (["success", "error", "denied"].includes(outcome)) {
    clauses.push("outcome = ?"); params.push(outcome);
  }
  if (Number.isSafeInteger(before) && before > 0) { clauses.push("id < ?"); params.push(before); }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const result = await db.prepare(`SELECT id, occurred_at, actor_email, actor_role,
      action, target_type, target_id, outcome, http_status, request_path
    FROM admin_audit_log ${where} ORDER BY id DESC LIMIT 51`).bind(...params).all();
  const rows = result.results || [];
  return { rows: rows.slice(0, 50), nextCursor: rows.length > 50 ? rows[49].id : 0 };
}
