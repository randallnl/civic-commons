import { env } from "cloudflare:workers";
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
  limit = 75,
} = {}) {
  const db = adminProfileGapsDb();
  if (!db) return { results: [], counts: emptyCounts() };

  const normalizedType = ["all", "representative", "candidate"].includes(profileType)
    ? profileType
    : "all";
  const normalizedMissing = ["any", "photo", "email", "website"].includes(missing)
    ? missing
    : "any";

  const [representatives, candidates] = await Promise.all([
    normalizedType === "candidate"
      ? []
      : getRepresentativeGaps(db, { missing: normalizedMissing, limit }),
    normalizedType === "representative"
      ? []
      : getCandidateGaps(db, { missing: normalizedMissing, limit }),
  ]);

  const results = [...representatives, ...candidates]
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, limit);

  return {
    results,
    counts: {
      total: results.length,
      representatives: representatives.length,
      candidates: candidates.length,
      missingPhoto: results.filter((item) => item.missing.photo).length,
      missingEmail: results.filter((item) => item.missing.email).length,
      missingWebsite: results.filter((item) => item.missing.website).length,
    },
  };
}

async function getRepresentativeGaps(db, { missing, limit }) {
  if (missing === "website") return [];

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

async function getCandidateGaps(db, { missing, limit }) {
  const result = await db
    .prepare(
      `SELECT
         filer_entity_number,
         candidate_first_name,
         candidate_last_name,
         office,
         county,
         district,
         political_party,
         candidate_email,
         candidate_website,
         photo_url,
         slug
       FROM candidates
       WHERE (
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
  };
}
