export const prerender = false;

import {
  adminDb,
  canUseSourceDataTools,
  forbiddenAdminResponse,
  requireAdmin,
} from "../../../lib/adminAuth";
import {
  rebuildAllGradeCaches,
  rebuildGradeCacheForPerson,
  rebuildGradeCacheForVoteKey,
} from "../../../lib/gradeCache";

export async function POST({ request }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  if (!canUseSourceDataTools(auth.session)) return forbiddenAdminResponse();

  const wantsHtml = request.headers.get("HX-Request") === "true";
  const startedAt = Date.now();

  try {
    const form = await request.formData();
    const scope = String(form.get("scope") || "all").trim();
    const db = adminDb();
    let result;
    let message;

    if (scope === "person") {
      const personId = String(form.get("personId") || form.get("personid") || "").trim();
      if (!personId) throw new Error("Person id is required.");
      result = await rebuildGradeCacheForPerson(db, { id: personId });
      message = result.grade
        ? `Rebuilt ${result.grade.letter} grade for person ${personId}.`
        : `Rebuilt grade cache for person ${personId}; no scored votes yet.`;
    } else if (scope === "vote") {
      const key = {
        sessionyear: form.get("sessionyear"),
        legislativebody: form.get("legislativebody"),
        votesequencenumber: form.get("votesequencenumber"),
        condensedbillno: form.get("condensedbillno"),
      };
      result = await rebuildGradeCacheForVoteKey(db, key);
      message = `Rebuilt grades for ${result.rebuilt} of ${result.affected} affected legislators.`;
    } else {
      const limit = Number(form.get("limit") || 500);
      result = await rebuildAllGradeCaches(db, { limit });
      message = `Finished rebuilding ${result.rebuilt} of ${result.requested} current legislator grade caches in ${formatDuration(Date.now() - startedAt)}${result.skipped ? `; ${result.skipped} skipped` : ""}.`;
    }

    console.log(JSON.stringify({
      event: "admin_grade_cache_rebuild_completed",
      durationMs: Date.now() - startedAt,
      result,
      scope,
    }));

    if (wantsHtml) return htmlStatus(message, "success");
    return json({ status: "ok", message, result });
  } catch (error) {
    const message = error?.message || "Unable to rebuild grade cache.";
    console.error(JSON.stringify({
      event: "admin_grade_cache_rebuild_failed",
      durationMs: Date.now() - startedAt,
      message,
    }));
    // HTMX does not swap non-2xx responses by default, so return an HTML error
    // fragment with a successful transport status while retaining 400 for API clients.
    if (wantsHtml) return htmlStatus(`Rebuild failed: ${message}`, "error");
    return json({ status: "error", message }, 400);
  }
}

function formatDuration(durationMs) {
  if (durationMs < 1000) return "under 1 second";
  if (durationMs < 60_000) {
    const seconds = durationMs < 10_000
      ? (durationMs / 1000).toFixed(1)
      : Math.round(durationMs / 1000);
    return `${seconds} seconds`;
  }

  const minutes = Math.floor(durationMs / 60_000);
  const seconds = Math.round((durationMs % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function htmlStatus(message, statusClass, status = 200) {
  return new Response(
    `<span class="inline-status ${statusClass}">${escapeHtml(message)}</span>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
