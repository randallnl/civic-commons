export const prerender = false;

import { adminDb, requireAdmin } from "../../../lib/adminAuth";

export async function POST({ request }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const db = adminDb();
    if (!db) throw new Error("D1 database binding is not configured.");

    const form = await request.formData();
    const sql = String(form.get("sql") || "").trim();
    const paramsText = String(form.get("params") || "").trim();

    if (!sql) throw new Error("SQL is required.");
    if (hasMultipleStatements(sql)) {
      throw new Error("Run one SQL statement at a time.");
    }

    const params = paramsText ? JSON.parse(paramsText) : [];
    if (!Array.isArray(params)) {
      throw new Error("Parameters must be a JSON array.");
    }

    const statement = db.prepare(sql).bind(...params);
    const keyword = sql.split(/\s+/)[0]?.toLowerCase();
    const result = keyword === "select" || keyword === "pragma"
      ? await statement.all()
      : await statement.run();

    const summary = summarizeResult(result);
    return redirectWithMessage(request, summary);
  } catch (error) {
    return redirectWithError(request, error?.message || "Unable to run SQL.");
  }
}

function hasMultipleStatements(sql = "") {
  return sql
    .replace(/;+\s*$/g, "")
    .includes(";");
}

function summarizeResult(result = {}) {
  if (Array.isArray(result.results)) {
    return `Query returned ${result.results.length} rows.`;
  }

  const changes = result.meta?.changes ?? result.changes ?? 0;
  return `SQL completed. ${changes} row${changes === 1 ? "" : "s"} changed.`;
}

function redirectWithMessage(request, message) {
  const url = new URL("/admin", request.url);
  url.searchParams.set("message", message);
  return Response.redirect(url, 303);
}

function redirectWithError(request, message) {
  const url = new URL("/admin", request.url);
  url.searchParams.set("error", message);
  return Response.redirect(url, 303);
}
