import { DEFAULT_CIVIC_API_BASE, civicApiFetch } from "./civicApi";
import { parseCandidate, parseList } from "./schemas";
import { cleanText } from "./text";

export function candidatesApiBase() {
  return import.meta.env.REP_LOOKUP_API_BASE || DEFAULT_CIVIC_API_BASE;
}

export async function getCandidates({
  apiBase = candidatesApiBase(),
  q = "",
  office = "",
  officeType = "",
  county = "",
  district = "",
  party = "",
  electionYear = "",
  limit = 100,
  offset = 0,
  runtimeEnv,
} = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (office) params.set("office", office);
  if (officeType) params.set("officeType", officeType);
  if (county) params.set("county", county);
  if (district) params.set("district", district);
  if (party) params.set("party", party);
  if (electionYear) params.set("electionYear", String(electionYear));
  if (limit) params.set("limit", String(limit));
  if (offset) params.set("offset", String(offset));

  const query = params.toString();
  const response = await civicApiFetch(`${apiBase}/candidates${query ? `?${query}` : ""}`, {
    runtimeEnv,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error || data.message || data.status === "error") {
    throw new Error("Candidate directory is unavailable.");
  }

  return {
    ...data,
    candidates: parseList(
      data.candidates ||
      data.results ||
      data.people ||
      [],
      parseCandidate,
    ),
  };
}

export async function getLegislativeCandidates({
  electionYear = 2026,
  limit = 100,
  maxPages = 20,
  runtimeEnv,
} = {}) {
  const searches = [
    { officeType: "General Court" },
    { office: "State Representative" },
    { office: "State Senate" },
    { office: "State Senator" },
  ];
  const batches = await Promise.all(
    searches.map((search) =>
      getCandidatePages({
        ...search,
        electionYear,
        limit,
        maxPages,
        runtimeEnv,
      }).catch(() => []),
    ),
  );

  return uniqueCandidates(batches.flat())
    .filter(isLegislativeCandidate)
    .sort((a, b) => candidateName(a).localeCompare(candidateName(b)));
}

async function getCandidatePages({
  limit = 100,
  maxPages = 20,
  ...query
} = {}) {
  const pageSize = Math.max(1, Math.min(Number(limit) || 100, 100));
  const candidates = [];

  for (let page = 0; page < maxPages; page += 1) {
    const data = await getCandidates({
      ...query,
      limit: pageSize,
      offset: page * pageSize,
    });
    const pageCandidates = data.candidates || [];
    candidates.push(...pageCandidates);
    if (pageCandidates.length === 0) break;
  }

  return candidates;
}

export async function getCandidate(slugOrId, {
  apiBase = candidatesApiBase(),
  runtimeEnv,
} = {}) {
  const response = await civicApiFetch(
    `${apiBase}/candidates/${encodeURIComponent(slugOrId)}`,
    { runtimeEnv, cache: "no-store" },
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error || data.message || data.status === "error") {
    throw new Error(`Unable to load candidate: ${response.status}`);
  }

  return {
    ...data,
    candidate: data.candidate ? parseCandidate(data.candidate) : data.candidate,
  };
}

export function candidateName(candidate = {}) {
  return cleanText(
    candidate.name ||
    [candidate.candidateFirstName, candidate.candidateLastName]
      .filter(Boolean)
      .join(" ")
  );
}

export function candidateSlug(candidate = {}) {
  const value =
    candidate.slug ||
    [
      candidate.filerEntityNumber,
      candidateName(candidate),
    ]
      .filter(Boolean)
      .join("-");

  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[''`’‘]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function candidatePath(candidate = {}) {
  return `/candidates/${candidateSlug(candidate)}`;
}

export function formatCandidateParty(party = "") {
  const value = cleanText(party).trim();
  if (!value) return "Party not listed";
  return value.replace(/\s+Party$/i, "");
}

export function partyClassName(party = "") {
  const value = String(party).toLowerCase();
  if (value.includes("republican")) return "party-republican";
  if (value.includes("democratic") || value.includes("democrat")) {
    return "party-democrat";
  }
  if (value.includes("libertarian")) return "party-libertarian";
  return "party-unknown";
}

export function candidateOfficePriority(value = "") {
  const officeName = String(value).trim().toLowerCase();
  if (
    officeName === "state representative" ||
    officeName === "state rep" ||
    officeName.includes("state representative") ||
    officeName.includes("representative in general court") ||
    officeName.includes("nh house")
  ) {
    return 0;
  }
  if (
    officeName === "state senate" ||
    officeName === "state senator" ||
    officeName.includes("state senate") ||
    officeName.includes("state senator") ||
    officeName.includes("nh senate")
  ) {
    return 1;
  }
  return 2;
}

export function isLegislativeCandidate(candidate = {}) {
  const officeType = String(candidate.officeType || "").trim().toLowerCase();
  return candidateOfficePriority(candidate.office) < 2 || officeType === "general court";
}

function uniqueCandidates(candidates = []) {
  const seen = new Map();
  const unique = [];

  for (const candidate of candidates) {
    const keys = candidateIdentityKeys(candidate);
    const existingIndex = keys
      .map((key) => seen.get(key))
      .find((index) => index !== undefined);

    if (existingIndex !== undefined) {
      const merged = mergeCandidateRecords(unique[existingIndex], candidate);
      unique[existingIndex] = merged;
      candidateIdentityKeys(merged).forEach((key) => seen.set(key, existingIndex));
      continue;
    }

    const index = unique.length;
    unique.push(candidate);
    keys.forEach((key) => seen.set(key, index));
  }

  return unique;
}

function candidateIdentityKeys(candidate = {}) {
  const keys = new Set();
  const personId = candidate.personId || candidate.person_id;
  const filerEntityNumber = candidate.filerEntityNumber || candidate.filer_entity_number;
  const slug = candidateSlug(candidate);
  const role = [
    candidate.office,
    candidate.county,
    candidate.district,
    candidate.electionYear || candidate.election_year,
  ].map(normalizeIdentityPart).join("|");
  const signature = [
    candidateName(candidate),
    candidate.office,
    candidate.county,
    candidate.district,
    candidate.electionYear || candidate.election_year,
  ].map(normalizeIdentityPart).join("|");

  if (filerEntityNumber) keys.add(`filer:${normalizeIdentityPart(filerEntityNumber)}`);
  if (slug) keys.add(`slug:${slug}`);
  if (personId && role.replace(/\|/g, "")) {
    keys.add(`person-role:${normalizeIdentityPart(personId)}|${role}`);
  }
  if (signature.replace(/\|/g, "")) keys.add(`signature:${signature}`);

  return [...keys];
}

function mergeCandidateRecords(current = {}, incoming = {}) {
  const primary =
    candidateCompletenessScore(incoming) > candidateCompletenessScore(current)
      ? incoming
      : current;
  const secondary = primary === incoming ? current : incoming;
  const merged = { ...secondary, ...primary };

  for (const [key, value] of Object.entries(secondary)) {
    if (!hasCandidateValue(merged[key]) && hasCandidateValue(value)) {
      merged[key] = value;
    }
  }

  return merged;
}

function candidateCompletenessScore(candidate = {}) {
  return [
    candidate.personId || candidate.person_id,
    candidate.filerEntityNumber || candidate.filer_entity_number,
    candidate.legislatorProfileUrl,
    candidate.currentLegislator || candidate.is_current_legislator,
    candidate.candidateWebsite || candidate.website,
    candidate.candidateEmail || candidate.email,
    candidate.photoUrl || candidate.photo_url,
    candidate.nameAliases || candidate.name_aliases,
  ].filter(hasCandidateValue).length;
}

function hasCandidateValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function normalizeIdentityPart(value = "") {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
