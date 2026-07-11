export const prerender = false;

import { adminDb, requireAdmin } from "../../../lib/adminAuth";

export async function POST({ request }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  let redirectTo = "/admin";
  try {
    const form = await request.formData();
    const entityType = String(form.get("entityType") || "").trim();
    const entityKey = String(form.get("entityKey") || "").trim();
    const confirmed = String(form.get("confirmRemove") || "") === "yes";
    redirectTo = safeRedirectPath(form.get("redirectTo")) || "/admin";

    if (!["candidate", "representative"].includes(entityType)) {
      throw new Error("Choose a candidate or legislator profile.");
    }
    if (!entityKey) throw new Error("Profile identifier is required.");
    if (!confirmed) throw new Error("Confirm the removal before submitting.");

    const result = await removeSourceProfile(entityType, entityKey);
    const destination = entityType === "candidate" ? "/candidates" : "/people";

    return redirectWithMessage(
      destination,
      `${result.label} removed from public results. ${result.changed} source row${result.changed === 1 ? "" : "s"} changed.`,
    );
  } catch (error) {
    return redirectWithError(redirectTo, error?.message || "Unable to remove profile.");
  }
}

async function removeSourceProfile(entityType, entityKey) {
  const db = adminDb();
  if (!db) throw new Error("D1 database binding is not configured.");

  if (entityType === "candidate") {
    const changed = await runSourceUpdate(
      db,
      `DELETE FROM candidates
       WHERE filer_entity_number = ? OR slug = ?`,
      [String(entityKey), String(entityKey)],
    );

    if (!changed) throw new Error("No matching candidate source row was removed.");
    return { changed, label: "Candidate" };
  }

  const personid = numericId(entityKey);
  if (!personid) throw new Error("A numeric legislator personid is required.");

  const changed = await runSourceUpdate(
    db,
    `UPDATE d1_legislators
     SET active = 0
     WHERE personid = ?`,
    [personid],
  );

  if (!changed) throw new Error("No matching legislator source row was removed.");
  return { changed, label: "Legislator" };
}

async function runSourceUpdate(db, sql, params) {
  const result = await db.prepare(sql).bind(...params).run();
  return result.meta?.changes ?? result.changes ?? 0;
}

function numericId(value = "") {
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : null;
}

function safeRedirectPath(value) {
  const path = String(value || "").trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "";
  return path;
}

function redirectWithMessage(path, message) {
  const url = new URL(path, "https://nhdeservesbetter.com");
  url.searchParams.set("message", message);
  return new Response(null, {
    status: 303,
    headers: {
      Location: url.pathname + url.search,
    },
  });
}

function redirectWithError(path, message) {
  const url = new URL(path, "https://nhdeservesbetter.com");
  url.searchParams.set("error", message);
  return new Response(null, {
    status: 303,
    headers: {
      Location: url.pathname + url.search,
    },
  });
}
