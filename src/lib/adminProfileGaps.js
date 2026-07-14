import { env } from "cloudflare:workers";
import {
  profileReviewKey,
  profileReviewMap,
  RECENT_REVIEW_DAYS,
} from "./adminProfileReviews";
import { cleanText } from "./text";

const PHOTO_BASE_PATTERNS = [
  /^https:\/\/photos\.nhciviccommons\.com\/?$/i,
  /^https:\/\/photos\.nhdeservesbetter\.com\/?$/i,
];
const PHOTO_BASE_URLS = [
  "https://photos.nhciviccommons.com/",
  "https://photos.nhdeservesbetter.com/",
];

export function adminProfileGapsDb() {
  return env.d1_db;
}

export async function getProfileGaps({
  profileType = "all",
  missing = "any",
  office = "",
  profile = "",
  review = "needs-review",
  limit = 75,
} = {}) {
  const db = adminProfileGapsDb();
  if (!db) return { results: [], counts: emptyCounts(), nameOptions: [] };

  const normalizedType = ["all", "representative", "candidate"].includes(profileType)
    ? profileType
    : "all";
  const normalizedMissing = ["any", "photo", "email", "website"].includes(missing)
    ? missing
    : "any";
  const normalizedOffice = normalizeOfficeFilter(office);
  const normalizedProfile = String(profile || "").trim();
  const normalizedReview = ["needs-review", "all", "recent"].includes(review)
    ? review
    : "needs-review";
  const queryLimit = Math.max(limit, 1000);
  const reviews = await profileReviewMap(db);

  const [representatives, candidates] = await Promise.all([
    normalizedType === "candidate"
      ? []
      : getRepresentativeGaps(db, { missing: normalizedMissing, office: normalizedOffice, limit: queryLimit }),
    normalizedType === "representative"
      ? []
      : getCandidateGaps(db, { missing: normalizedMissing, office: normalizedOffice, limit: queryLimit }),
  ]);

  const reviewedResults = [...representatives, ...candidates]
    .map((item) => withReview(item, reviews))
    .sort((a, b) => a.name.localeCompare(b.name));
  const allResults = reviewedResults
    .filter((item) => reviewMatches(item.review, normalizedReview))
    .sort((a, b) => a.name.localeCompare(b.name));
  const results = allResults
    .filter((item) => !normalizedProfile || profileOptionValue(item) === normalizedProfile)
    .slice(0, limit);

  return {
    results,
    nameOptions: allResults.map((item) => ({
      value: profileOptionValue(item),
      label: [item.name, item.subtitle].filter(Boolean).join(" - "),
    })),
    counts: {
      total: results.length,
      representatives: results.filter((item) => item.type === "representative").length,
      candidates: results.filter((item) => item.type === "candidate").length,
      missingPhoto: results.filter((item) => item.missing.photo).length,
      missingEmail: results.filter((item) => item.missing.email).length,
      missingWebsite: results.filter((item) => item.missing.website).length,
      recentlyReviewed: reviewedResults.filter((item) => item.review?.isRecent).length,
      recentReviewDays: RECENT_REVIEW_DAYS,
    },
  };
}

async function getRepresentativeGaps(db, { missing, office, limit }) {
  if (missing === "website") return [];
  const bodyFilter = representativeBodyForOffice(office);
  if (office && !bodyFilter) return [];

  const result = await db
    .prepare(
      `SELECT
         l.personid,
         l.employeeno,
         l.firstname,
         l.lastname,
         l.legislativebody,
         l.party,
         l.district,
         l.emailaddress,
         COALESCE(p.photo_url, '') AS photo_url
       FROM d1_legislators l
       LEFT JOIN d1_legislator_photos p
         ON p.employeeno = l.employeeno
       WHERE l.active = 1
         AND (? = '' OR l.legislativebody = ?)
         AND (
           ? = 'any'
           OR (? = 'photo' AND (
             p.photo_url IS NULL
             OR TRIM(p.photo_url) = ''
             OR TRIM(p.photo_url) IN (?, ?)
           ))
           OR (? = 'email' AND (l.emailaddress IS NULL OR TRIM(l.emailaddress) = ''))
         )
         AND (
           p.photo_url IS NULL
           OR TRIM(p.photo_url) = ''
           OR TRIM(p.photo_url) IN (?, ?)
           OR l.emailaddress IS NULL
           OR TRIM(l.emailaddress) = ''
         )
       ORDER BY l.lastname, l.firstname
       LIMIT ?`,
    )
    .bind(
      bodyFilter,
      bodyFilter,
      missing,
      missing,
      PHOTO_BASE_URLS[0],
      PHOTO_BASE_URLS[1],
      missing,
      PHOTO_BASE_URLS[0],
      PHOTO_BASE_URLS[1],
      limit,
    )
    .all();

  return (result.results || []).map((row) => {
    const name = cleanText(`${row.firstname || ""} ${row.lastname || ""}`.trim());
    return {
      type: "representative",
      key: row.personid,
      name,
      subtitle: [
        row.party,
        row.legislativebody === "S" ? "Senate" : "House",
        row.district && `District ${row.district}`,
      ].filter(Boolean).join(" · "),
      profilePath: `/people/${encodeURIComponent(row.personid)}`,
      missing: {
        photo: !hasUsefulPhoto(row.photo_url),
        email: !String(row.emailaddress || "").trim(),
        website: false,
      },
    };
  });
}

async function getCandidateGaps(db, { missing, office, limit }) {
  const result = await db
    .prepare(
      `WITH candidate_base AS (
         SELECT
           p.id AS person_id,
           COALESCE(cr.filer_entity_number, p.filer_entity_number, c.filer_entity_number, CAST(p.id AS TEXT)) AS filer_entity_number,
           p.firstname AS candidate_first_name,
           p.lastname AS candidate_last_name,
           COALESCE(
             NULLIF(cr.office, ''),
             CASE
               WHEN lr.legislativebody = 'S' THEN 'State Senate'
               WHEN lr.legislativebody = 'H' THEN 'State Representative'
               ELSE ''
             END
           ) AS office,
           COALESCE(NULLIF(cr.county, ''), cc.name, c.county, '') AS county,
           COALESCE(NULLIF(cr.district, ''), lr.district, c.district, '') AS district,
           COALESCE(NULLIF(cr.political_party, ''), c.political_party, p.party, '') AS political_party,
           COALESCE(NULLIF(p.email, ''), c.candidate_email, '') AS candidate_email,
           COALESCE(NULLIF(p.website_url, ''), c.candidate_website, '') AS candidate_website,
           COALESCE(NULLIF(p.photo_url, ''), c.photo_url, '') AS photo_url,
           COALESCE(NULLIF(p.slug, ''), c.slug, CAST(p.id AS TEXT)) AS slug
         FROM d1_people p
         LEFT JOIN d1_person_candidate_roles cr
           ON cr.person_id = p.id
           AND cr.election_year = 2026
         LEFT JOIN d1_person_legislator_roles lr
           ON lr.person_id = p.id
           AND lr.active = 1
           AND lr.session_year = 2026
         LEFT JOIN county_codes cc
           ON cc.source_county_id = CAST(lr.countycode AS INTEGER)
           OR LOWER(cc.name) = LOWER(cr.county)
         LEFT JOIN candidates c
           ON c.filer_entity_number = cr.filer_entity_number
           OR c.filer_entity_number = p.filer_entity_number
         WHERE p.is_2026_candidate = 1
       )
       SELECT *
       FROM candidate_base
       WHERE (? = '' OR LOWER(TRIM(office)) = ?)
       AND (
         ? = 'any'
         OR (? = 'photo' AND (
           photo_url IS NULL
           OR TRIM(photo_url) = ''
           OR TRIM(photo_url) IN (?, ?)
         ))
         OR (? = 'email' AND (candidate_email IS NULL OR TRIM(candidate_email) = ''))
         OR (? = 'website' AND (candidate_website IS NULL OR TRIM(candidate_website) = ''))
       )
       AND (
         photo_url IS NULL
         OR TRIM(photo_url) = ''
         OR TRIM(photo_url) IN (?, ?)
         OR candidate_email IS NULL
         OR TRIM(candidate_email) = ''
         OR candidate_website IS NULL
         OR TRIM(candidate_website) = ''
       )
       ORDER BY candidate_last_name, candidate_first_name
       LIMIT ?`,
    )
    .bind(
      office,
      office,
      missing,
      missing,
      PHOTO_BASE_URLS[0],
      PHOTO_BASE_URLS[1],
      missing,
      missing,
      PHOTO_BASE_URLS[0],
      PHOTO_BASE_URLS[1],
      limit,
    )
    .all();

  return (result.results || []).map((row) => {
    const name = cleanText(
      `${row.candidate_first_name || ""} ${row.candidate_last_name || ""}`.trim(),
    );
    return {
      type: "candidate",
      key: row.filer_entity_number,
      name,
      subtitle: [
        row.political_party,
        row.office,
        row.county,
        row.district && `District ${row.district}`,
      ].filter(Boolean).join(" · "),
      profilePath: `/candidates/${encodeURIComponent(row.slug || row.filer_entity_number)}`,
      missing: {
        photo: !hasUsefulPhoto(row.photo_url),
        email: !String(row.candidate_email || "").trim(),
        website: !String(row.candidate_website || "").trim(),
      },
    };
  });
}

function hasUsefulPhoto(value = "") {
  const photo = String(value || "").trim();
  if (!photo) return false;
  return !PHOTO_BASE_PATTERNS.some((pattern) => pattern.test(photo));
}

function emptyCounts() {
  return {
    total: 0,
    representatives: 0,
    candidates: 0,
    missingPhoto: 0,
    missingEmail: 0,
    missingWebsite: 0,
    recentlyReviewed: 0,
    recentReviewDays: RECENT_REVIEW_DAYS,
  };
}

function profileOptionValue(item = {}) {
  return [item.type, item.key].filter(Boolean).join(":");
}

function normalizeOfficeFilter(value = "") {
  return String(value || "").trim().toLowerCase();
}

function representativeBodyForOffice(office = "") {
  if (!office) return "";
  if (office === "state representative" || office === "house") return "H";
  if (office === "state senate" || office === "state senator" || office === "senate") return "S";
  return null;
}

function withReview(item = {}, reviews = new Map()) {
  return {
    ...item,
    review: reviews.get(profileReviewKey(item.type, item.key)) || null,
  };
}

function reviewMatches(review, filter) {
  if (filter === "all") return true;
  if (filter === "recent") return Boolean(review?.isRecent);
  return !review?.isRecent;
}
