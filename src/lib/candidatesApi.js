const DEFAULT_API_BASE = "https://api.nhciviccommons.com";

export function candidatesApiBase() {
  return import.meta.env.REP_LOOKUP_API_BASE || DEFAULT_API_BASE;
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
  const response = await fetch(`${apiBase}/candidates${query ? `?${query}` : ""}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error || data.message || data.status === "error") {
    throw new Error("Candidate directory is unavailable.");
  }

  return {
    ...data,
    candidates:
      data.candidates ||
      data.results ||
      data.people ||
      [],
  };
}

export async function getCandidate(slugOrId, { apiBase = candidatesApiBase() } = {}) {
  const response = await fetch(
    `${apiBase}/candidates/${encodeURIComponent(slugOrId)}`,
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error || data.message || data.status === "error") {
    throw new Error(`Unable to load candidate: ${response.status}`);
  }

  return data;
}

export function candidateName(candidate = {}) {
  return (
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
  const value = String(party).trim();
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
