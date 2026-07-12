import { candidateName, candidatePath, getCandidates } from "./candidatesApi";
import { getRepresentatives, repName, repSlug } from "./repsApi";

export async function enrichCandidatesWithLegislators(candidates = []) {
  if (!candidates.length) return [];

  let representatives = [];
  try {
    const data = await getRepresentatives({ limit: 700 });
    representatives = data.representatives || [];
  } catch (error) {
    console.error(error?.message || "Unable to load current legislators for candidate matching.");
    return candidates;
  }

  return candidates.map((candidate) => attachLegislatorMatch(candidate, representatives));
}

export async function enrichCandidateWithLegislator(candidate = {}) {
  const name = candidateName(candidate);
  if (!name) return candidate;

  try {
    const data = await getRepresentatives({ q: name, limit: 25 });
    return attachLegislatorMatch(candidate, data.representatives || []);
  } catch (error) {
    console.error(error?.message || "Unable to load current legislator for candidate matching.");
    return candidate;
  }
}

export async function candidateProfileForLegislator(rep = {}) {
  const name = repName(rep);
  if (!name) return null;

  try {
    const data = await getCandidates({ q: name, electionYear: 2026, limit: 25 });
    const match = (data.candidates || [])
      .map((candidate) => ({ candidate, score: matchScore(candidate, rep) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)[0]?.candidate;

    if (!match) return null;

    return {
      candidate: match,
      href: candidatePath(match),
      label: "Candidate Profile",
    };
  } catch (error) {
    console.error(error?.message || "Unable to load matching candidate profile.");
    return null;
  }
}

export function attachLegislatorMatch(candidate = {}, representatives = []) {
  const match = bestLegislatorMatch(candidate, representatives);
  if (!match) return candidate;

  return {
    ...candidate,
    currentLegislator: true,
    legislatorName: repName(match),
    legislatorPersonId: match.personid || match.id || "",
    legislatorProfileUrl: `/people/${repSlug(match)}`,
    legislatorPhotoUrl: match.photo || match.photo_url || "",
  };
}

function bestLegislatorMatch(candidate = {}, representatives = []) {
  const scored = representatives
    .map((rep) => ({ rep, score: matchScore(candidate, rep) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.rep || null;
}

function matchScore(candidate = {}, rep = {}) {
  if (!namesMatch(candidate, rep)) return 0;

  const targetBody = candidateTargetBody(candidate);
  const repBodyName = repBody(rep);
  if (targetBody && repBodyName && targetBody !== repBodyName) return 0;

  let score = 10;
  if (targetBody && targetBody === repBodyName) score += 4;

  const candidateDistrict = numericText(candidate.district);
  const representativeDistrict = numericText(rep.raw_district || rep.district);
  if (candidateDistrict && representativeDistrict) {
    if (candidateDistrict !== representativeDistrict) return 0;
    score += 3;
  }

  const candidateCounty = normalizeText(candidate.county);
  const representativeCounty = normalizeText(rep.county || rep.countyName || rep.county_name);
  if (candidateCounty && representativeCounty && candidateCounty === representativeCounty) {
    score += 2;
  }

  return score;
}

function namesMatch(candidate = {}, rep = {}) {
  const candidateFullName = normalizeName(candidateName(candidate));
  const repFullName = normalizeName(repName(rep));
  if (candidateFullName && repFullName && candidateFullName === repFullName) return true;

  const candidateFirst = normalizeName(candidate.candidateFirstName || candidate.firstname);
  const candidateLast = normalizeName(candidate.candidateLastName || candidate.lastname);
  const repFirst = normalizeName(rep.firstname);
  const repLast = normalizeName(rep.lastname);

  return !!candidateFirst && !!candidateLast && candidateFirst === repFirst && candidateLast === repLast;
}

function candidateTargetBody(candidate = {}) {
  const office = normalizeText(`${candidate.office || ""} ${candidate.officeType || ""}`);
  if (office.includes("state representative") || office.includes("house")) return "house";
  if (office.includes("state senate") || office.includes("senate")) return "senate";
  return "";
}

function repBody(rep = {}) {
  const value = normalizeText(`${rep.chamber || ""} ${rep.legislativebody || ""} ${rep.body || ""}`);
  if (value.includes("house") || value === "h") return "house";
  if (value.includes("senate") || value === "s") return "senate";
  return "";
}

function normalizeName(value = "") {
  return normalizeText(value).replace(/\b(jr|sr|ii|iii|iv)\b/g, "").trim();
}

function normalizeText(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function numericText(value = "") {
  const match = String(value || "").match(/\d+/);
  return match ? String(Number(match[0])) : "";
}
