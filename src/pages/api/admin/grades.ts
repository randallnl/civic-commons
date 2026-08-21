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
      message = `Rebuilt ${result.rebuilt} legislator grade caches.`;
    }

    if (wantsHtml) return htmlStatus(message, "success");
    return json({ status: "ok", message, result });
  } catch (error) {
    const message = error?.message || "Unable to rebuild grade cache.";
    if (wantsHtml) return htmlStatus(message, "error", 400);
    return json({ status: "error", message }, 400);
  }
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
