export const prerender = false;

import { adminDb, requireAdmin } from "../../../lib/adminAuth";
import { markProfileReviewed } from "../../../lib/adminProfileReviews";
import {
  linkCandidateToLegislator,
  linkLegislatorToCandidate,
} from "../../../lib/candidateLegislatorLinks";
import {
  ensureUnifiedPeopleTables,
  upsertPersonFromCandidate,
  upsertPersonFromLegislator,
} from "../../../lib/unifiedPeople";

const CANDIDATE_FIELDS = [
  "name",
  "nameAliases",
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
  "linkedRepresentativePersonId",
];

const REPRESENTATIVE_FIELDS = [
  "name",
  "nameAliases",
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
  "linkedCandidateFilerEntityNumber",
];

export async function POST({ request }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const wantsHtml = request.headers.get("HX-Request") === "true";
  let redirectTo = "/admin";
  try {
    const form = await request.formData();
    const entityType = String(form.get("entityType") || "").trim();
    const entityKey = String(form.get("entityKey") || "").trim();
    const profileAction = String(form.get("profileAction") || "save").trim();
    redirectTo = safeRedirectPath(form.get("redirectTo")) || "/admin";
    const clearFields = new Set(form.getAll("clearFields").map(String));
    const fields = entityType === "candidate" ? CANDIDATE_FIELDS : REPRESENTATIVE_FIELDS;

    if (!["candidate", "representative"].includes(entityType)) {
      throw new Error("Choose a candidate or legislator profile.");
    }
    if (!entityKey) throw new Error("Profile identifier is required.");

    if (profileAction === "confirm-reviewed") {
      await markProfileReviewed({
        entityType,
        entityKey,
        reviewedBy: auth.session?.email || "",
        reviewNote:
          String(form.get("reviewNote") || "").trim() ||
          "Reviewed for missing photo, website, or email; no update found.",
      });
      if (wantsHtml) {
        return htmlMessage(
          "Profile marked reviewed. It will be hidden from the default cleanup queue for 30 days.",
          "success",
        );
      }
      return redirectWithMessage(
        redirectTo,
        "Profile marked reviewed. It will be hidden from the default cleanup queue for 30 days.",
      );
    }

    const data = {};
    for (const field of fields) {
      const value = String(form.get(field) || "").trim();
      if (value) data[field] = normalizeFieldValue(field, value);
      if (!value && clearFields.has(field)) data[field] = "";
    }

    const sourceUpdate = await updateSourceProfile(entityType, entityKey, data);
    const savedMessage = `Profile edits saved to source D1 tables. ${sourceUpdate.changed} row${sourceUpdate.changed === 1 ? "" : "s"} changed.`;

    if (wantsHtml) return htmlMessage(savedMessage, "success");
    return redirectWithMessage(redirectTo, savedMessage);
  } catch (error) {
    if (wantsHtml) {
      return htmlMessage(error?.message || "Unable to save profile edits.", "error");
    }
    return redirectWithError(redirectTo, error?.message || "Unable to save profile edits.");
  }
}

function normalizeFieldValue(field, value) {
  if (field === "nameAliases") return normalizeAliases(value);
  if (field === "electionYear") return Number(value) || value;
  if (field === "totalRaised" || field === "totalSpent") return Number(value) || 0;
  if (field === "is_free_stater") {
    return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
  }
  return value;
}

function normalizeAliases(value = "") {
  return String(value || "")
    .split(/[\n,;]/)
    .map((alias) => alias.trim())
    .filter(Boolean)
    .filter((alias, index, aliases) =>
      aliases.findIndex((candidate) => candidate.toLowerCase() === alias.toLowerCase()) === index,
    )
    .join(", ");
}

async function updateSourceProfile(entityType, entityKey, data) {
  const db = adminDb();
  if (!db) throw new Error("D1 database binding is not configured.");

  if (entityType === "representative") {
    return updateRepresentativeSource(db, entityKey, data);
  }

  if (entityType === "candidate") {
    return updateCandidateSource(db, entityKey, data);
  }

  throw new Error("Unsupported profile type.");
}

async function updateRepresentativeSource(db, entityKey, data) {
  const personid = numericId(entityKey);
  if (!personid) throw new Error("A numeric legislator personid is required.");

  await ensureUnifiedPeopleTables(db);
  let changed = 0;
  const firstName = data.firstname || firstNameFromFullName(data.name);
  const lastName = data.lastname || lastNameFromFullName(data.name);
  const body = chamberToBody(data.chamber);
  const district = data.raw_district || data.district || "";

  changed += await runSourceUpdate(
    db,
      `UPDATE d1_legislators
       SET firstname = COALESCE(NULLIF(?, ''), firstname),
           lastname = COALESCE(NULLIF(?, ''), lastname),
           middlename = COALESCE(NULLIF(?, ''), middlename),
           party = COALESCE(NULLIF(?, ''), party),
           legislativebody = COALESCE(NULLIF(?, ''), legislativebody),
           district = COALESCE(NULLIF(?, ''), district),
           emailaddress = COALESCE(NULLIF(?, ''), emailaddress),
           is_free_stater = CASE
             WHEN ? IS NULL THEN is_free_stater
             ELSE ?
           END
       WHERE personid = ?`,
      [
        firstName,
        lastName,
        data.middlename || "",
        data.party || "",
        body,
        district,
        data.email || "",
        freeStaterValue(data),
        freeStaterValue(data),
        personid,
      ],
    );

  if (data.photo) {
    changed += await runSourceUpdate(
      db,
      `INSERT INTO d1_legislator_photos (
         employeeno,
         personid,
         firstname,
         lastname,
         filename,
         photo_url,
         source,
         updated_at
       )
       SELECT
         employeeno,
         personid,
         firstname,
         lastname,
         ?,
         ?,
         'admin',
         CURRENT_TIMESTAMP
       FROM d1_legislators
       WHERE personid = ?
       ON CONFLICT(employeeno) DO UPDATE SET
         personid = excluded.personid,
         firstname = excluded.firstname,
         lastname = excluded.lastname,
         filename = excluded.filename,
         photo_url = excluded.photo_url,
         source = excluded.source,
         updated_at = CURRENT_TIMESTAMP`,
      [filenameFromUrl(data.photo), data.photo, personid],
    );
  }

  if (Object.prototype.hasOwnProperty.call(data, "linkedCandidateFilerEntityNumber")) {
    const linkUpdate = await linkLegislatorToCandidate(
      personid,
      data.linkedCandidateFilerEntityNumber || "",
      db,
    );
    changed += linkUpdate.changed || 0;
  }

  await upsertPersonFromLegislator(personid, db);
  changed += await updatePersonAliases(db, { gcPersonid: personid }, data);

  if (!changed) throw new Error("No matching legislator source row was updated.");
  return { changed };
}

async function updateCandidateSource(db, entityKey, data) {
  await ensureUnifiedPeopleTables(db);
  const firstName = data.candidateFirstName || firstNameFromFullName(data.name);
  const lastName = data.candidateLastName || lastNameFromFullName(data.name);
  let changed = await runSourceUpdate(
    db,
    `UPDATE candidates
     SET candidate_first_name = COALESCE(NULLIF(?, ''), candidate_first_name),
         candidate_last_name = COALESCE(NULLIF(?, ''), candidate_last_name),
         political_party = COALESCE(NULLIF(?, ''), political_party),
         office_type = COALESCE(NULLIF(?, ''), office_type),
         office = COALESCE(NULLIF(?, ''), office),
         county = COALESCE(NULLIF(?, ''), county),
         district = COALESCE(NULLIF(?, ''), district),
         candidate_email = COALESCE(NULLIF(?, ''), candidate_email),
         candidate_website = COALESCE(NULLIF(?, ''), candidate_website),
         photo_url = COALESCE(NULLIF(?, ''), photo_url),
         election_year = COALESCE(?, election_year),
         election_cycle = COALESCE(NULLIF(?, ''), election_cycle),
         total_raised = COALESCE(?, total_raised),
         total_spent = COALESCE(?, total_spent),
         is_free_stater = CASE
           WHEN ? IS NULL THEN is_free_stater
           ELSE ?
         END
     WHERE filer_entity_number = ? OR slug = ?`,
    [
      firstName,
      lastName,
      data.politicalParty || "",
      data.officeType || "",
      data.office || "",
      data.county || "",
      data.district || "",
      data.candidateEmail || "",
      data.candidateWebsite || "",
      data.photoUrl || "",
      numberOrNull(data.electionYear),
      data.electionCycle || "",
      numberOrNull(data.totalRaised),
      numberOrNull(data.totalSpent),
      freeStaterValue(data),
      freeStaterValue(data),
      String(entityKey),
      String(entityKey),
    ],
  );

  if (Object.prototype.hasOwnProperty.call(data, "linkedRepresentativePersonId")) {
    const linkUpdate = await linkCandidateToLegislator(
      String(entityKey),
      data.linkedRepresentativePersonId || "",
      db,
    );
    changed += linkUpdate.changed || 0;
  }

  await upsertPersonFromCandidate(String(entityKey), db);
  changed += await updatePersonAliases(db, { filerEntityNumber: String(entityKey) }, data);

  if (!changed) throw new Error("No matching candidate source row was updated.");
  return { changed };
}

async function updatePersonAliases(db, identifiers = {}, data = {}) {
  if (!Object.prototype.hasOwnProperty.call(data, "nameAliases")) return 0;

  const clauses = [];
  const params = [data.nameAliases || ""];

  if (identifiers.gcPersonid) {
    clauses.push("gc_personid = ?");
    params.push(identifiers.gcPersonid);
  }
  if (identifiers.filerEntityNumber) {
    clauses.push("filer_entity_number = ?");
    params.push(identifiers.filerEntityNumber);
  }
  if (!clauses.length) return 0;

  const result = await db
    .prepare(
      `UPDATE d1_people
       SET name_aliases = ?, updated_at = CURRENT_TIMESTAMP
       WHERE ${clauses.join(" OR ")}`,
    )
    .bind(...params)
    .run();
  return result.meta?.changes ?? result.changes ?? 0;
}

async function runSourceUpdate(db, sql, params) {
  const result = await db.prepare(sql).bind(...params).run();
  return result.meta?.changes ?? result.changes ?? 0;
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

function numberOrNull(value) {
  if (value === "" || value === undefined || value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function freeStaterValue(data = {}) {
  if (!Object.prototype.hasOwnProperty.call(data, "is_free_stater")) return null;
  return data.is_free_stater ? 1 : 0;
}

function firstNameFromFullName(value = "") {
  return String(value).trim().split(/\s+/).filter(Boolean)[0] || "";
}

function lastNameFromFullName(value = "") {
  const parts = String(value).trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? parts.slice(1).join(" ") : "";
}

function filenameFromUrl(value = "") {
  const text = String(value).trim();
  try {
    const url = new URL(text);
    return decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || text);
  } catch {
    return text.split("/").filter(Boolean).pop() || text;
  }
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

function htmlMessage(message, status = "success", responseStatus = 200) {
  return new Response(
    `<span class="inline-status ${status}">${escapeHtml(message)}</span>`,
    {
      status: responseStatus,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
