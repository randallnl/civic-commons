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
    if (pageCandidates.length < pageSize) break;
  }

  return candidates;
}

export async function getCandidate(slugOrId, {
  apiBase = candidatesApiBase(),
  runtimeEnv,
} = {}) {
  const response = await civicApiFetch(
    `${apiBase}/candidates/${encodeURIComponent(slugOrId)}`,
    { runtimeEnv },
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
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = candidateSlug(candidate);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
