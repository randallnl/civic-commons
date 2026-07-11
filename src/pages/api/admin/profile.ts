export const prerender = false;

import { adminDb, requireAdmin } from "../../../lib/adminAuth";
import { saveProfileEdit, slugifyProfile } from "../../../lib/adminProfileEdits";

const CANDIDATE_FIELDS = [
  "name",
  "candidateFirstName",
  "candidateLastName",
  "politicalParty",
  "officeType",
  "office",
  "county",
  "district",
  "candidateEmail",
  "candidateWebsite",
  "photoUrl",
  "electionYear",
  "electionCycle",
  "totalRaised",
  "totalSpent",
  "is_free_stater",
];

const REPRESENTATIVE_FIELDS = [
  "name",
  "firstname",
  "lastname",
  "middlename",
  "party",
  "chamber",
  "district",
  "raw_district",
  "location_text",
  "towns_represented",
  "email",
  "phone",
  "photo",
  "notes",
  "is_free_stater",
];

export async function POST({ request }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  let redirectTo = "/admin";
  try {
    const form = await request.formData();
    const entityType = String(form.get("entityType") || "").trim();
    const entityKey = String(form.get("entityKey") || "").trim();
    redirectTo = safeRedirectPath(form.get("redirectTo")) || "/admin";
    const clearFields = new Set(form.getAll("clearFields").map(String));
    const fields = entityType === "candidate" ? CANDIDATE_FIELDS : REPRESENTATIVE_FIELDS;

    if (!["candidate", "representative"].includes(entityType)) {
      throw new Error("Choose a candidate or legislator profile.");
    }
    if (!entityKey) throw new Error("Profile identifier is required.");

    const data = {};
    for (const field of fields) {
      const value = String(form.get(field) || "").trim();
      if (value) data[field] = normalizeFieldValue(field, value);
      if (!value && clearFields.has(field)) data[field] = "";
    }

    await saveProfileEdit({
      entityType,
      entityKey,
      displayName: data.name || "",
      data,
      updatedBy: auth.session?.email || "",
    });

    await applyBestEffortBaseUpdate(entityType, entityKey, data);

    return redirectWithMessage(redirectTo, "Profile edits saved.");
  } catch (error) {
    return redirectWithError(redirectTo, error?.message || "Unable to save profile edits.");
  }
}

function normalizeFieldValue(field, value) {
  if (field === "electionYear") return Number(value) || value;
  if (field === "totalRaised" || field === "totalSpent") return Number(value) || 0;
  if (field === "is_free_stater") {
    return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
  }
  return value;
}

async function applyBestEffortBaseUpdate(entityType, entityKey, data) {
  const db = adminDb();
  if (!db) return;

  if (entityType === "representative") {
    await bestEffortUpdate(
      db,
      `UPDATE people
       SET full_name = COALESCE(NULLIF(?, ''), full_name),
           bio = COALESCE(NULLIF(?, ''), bio),
           photo_url = COALESCE(NULLIF(?, ''), photo_url),
           party = COALESCE(NULLIF(?, ''), party),
           email = COALESCE(NULLIF(?, ''), email),
           phone = COALESCE(NULLIF(?, ''), phone),
           updated_at = datetime('now')
       WHERE id = ? OR slug = ?`,
      [
        data.name || "",
        data.notes || "",
        data.photo || "",
        data.party || "",
        data.email || "",
        data.phone || "",
        numericId(entityKey),
        slugifyProfile(entityKey),
      ],
    );

    await bestEffortUpdate(
      db,
      `UPDATE d1_legislators
       SET firstname = COALESCE(NULLIF(?, ''), firstname),
           lastname = COALESCE(NULLIF(?, ''), lastname),
           middlename = COALESCE(NULLIF(?, ''), middlename),
           party = COALESCE(NULLIF(?, ''), party),
           legislativebody = COALESCE(NULLIF(?, ''), legislativebody),
           district = COALESCE(NULLIF(?, ''), district),
           emailaddress = COALESCE(NULLIF(?, ''), emailaddress)
       WHERE personid = ?`,
      [
        data.firstname || "",
        data.lastname || "",
        data.middlename || "",
        data.party || "",
        chamberToBody(data.chamber),
        data.raw_district || data.district || "",
        data.email || "",
        numericId(entityKey),
      ],
    );
  }

  if (entityType === "candidate") {
    await bestEffortUpdate(
      db,
      `UPDATE people
       SET full_name = COALESCE(NULLIF(?, ''), full_name),
           photo_url = COALESCE(NULLIF(?, ''), photo_url),
           email = COALESCE(NULLIF(?, ''), email),
           website_url = COALESCE(NULLIF(?, ''), website_url),
           party = COALESCE(NULLIF(?, ''), party),
           updated_at = datetime('now')
       WHERE id = ? OR slug = ?`,
      [
        data.name || "",
        data.photoUrl || "",
        data.candidateEmail || "",
        data.candidateWebsite || "",
        data.politicalParty || "",
        numericId(entityKey),
        slugifyProfile(entityKey),
      ],
    );
  }
}

async function bestEffortUpdate(db, sql, params) {
  try {
    await db.prepare(sql).bind(...params).run();
  } catch {
    // The public API database schema can drift. The admin override remains saved.
  }
}

function chamberToBody(value = "") {
  if (/^house$/i.test(value)) return "H";
  if (/^senate$/i.test(value)) return "S";
  return value;
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
