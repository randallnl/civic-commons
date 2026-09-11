import { profilePhotoUrl } from "./photos.js";
import { isFreeStater, isTpActionAligned } from "./civicTags.js";

const DEFAULT_SUGGEST_UPDATE_PATH = "/suggest-update";
const DEFAULT_FALLBACK_PORTRAIT_PATH = "/nhdb-logo-circle.png";

/**
 * Groups legislative candidates into the offices voters see as one ballot
 * choice. This stays separate from the page display grouping so the admin
 * publisher can load every available seat at once.
 */
export function groupCandidatesForSocialShare(candidates = []) {
  const groups = new Map();

  for (const candidate of candidates) {
    const label = candidateSeatLabel(candidate);
    if (!groups.has(label)) {
      groups.set(label, {
        label,
        office: cleanText(candidate.office),
        county: cleanText(candidate.county),
        district: cleanText(candidate.district),
        candidates: [],
      });
    }
    groups.get(label).candidates.push(candidate);
  }

  return [...groups.values()].sort((first, second) => {
    const officeDifference = candidateOfficePriority(first.office) - candidateOfficePriority(second.office);
    if (officeDifference) return officeDifference;

    return [
      first.county.localeCompare(second.county),
      numericSortValue(first.district) - numericSortValue(second.district),
      first.label.localeCompare(second.label),
    ].find((value) => value !== 0) || 0;
  });
}

/**
 * Turns the office groups already shown in the directory into a small,
 * browser-safe share model. Keeping this in a library gives the post copy and
 * profile links one canonical definition for every seat-sharing surface.
 */
export function seatSocialShareOptions(groups = [], { origin = "" } = {}) {
  return groups
    .map((group) => {
      const label = seatLabel(group);
      const candidates = uniqueShareCandidates(group?.candidates || [])
        .map((candidate) => shareCandidate(candidate, { origin }))
        .filter((candidate) => candidate.name && candidate.profileUrl && candidate.entityId);

      if (!label || !candidates.length) return null;

      return {
        id: seatId(group, label),
        label,
        candidates,
      };
    })
    .filter(Boolean);
}

export function socialPostCopyForSeat(seat, {
  suggestUpdateUrl = "",
} = {}) {
  const label = cleanText(seat?.label);
  const candidates = Array.isArray(seat?.candidates) ? seat.candidates : [];
  const submissionUrl = cleanText(suggestUpdateUrl) || DEFAULT_SUGGEST_UPDATE_PATH;

  const lines = [
    "Do you know your candidates?",
    "",
    `For ${label || "this seat"}, your candidates are:`,
    ...candidates.map((candidate) =>
      `${cleanText(candidate.name)}: ${cleanText(candidate.profileUrl)}`,
    ),
    "",
    "Get to know your candidates or share information to keep others informed.",
    "NH Deserves Better offers insights on published endorsements, mentions in the news, and community input about candidates’ actions, positions, and involvement.",
    "Share verifiable information at NH Deserves Better:",
    submissionUrl,
  ];

  return lines.join("\n");
}

function shareCandidate(candidate = {}, { origin = "" } = {}) {
  const name = candidateName(candidate);
  const profileUrl = absoluteUrl(
    candidate.legislatorProfileUrl || `/people/${candidateSlug(candidate)}`,
    origin,
  );
  const portraitUrl = absoluteUrl(
    profilePhotoUrl(candidate.photoUrl) ||
      profilePhotoUrl(candidate.legislatorPhotoUrl) ||
      DEFAULT_FALLBACK_PORTRAIT_PATH,
    origin,
  );

  return {
    name,
    entityId: cleanText(candidate.filerEntityNumber || candidate.filer_entity_number || candidateSlug(candidate)),
    profileUrl,
    portraitUrl,
    office: candidateOfficeLine(candidate),
    party: candidateParty(candidate),
    townsRepresented: candidateTowns(candidate),
    freeStateAligned: isFreeStater(candidate),
    tpactionAligned: isTpActionAligned(candidate),
    tags: candidateContextTags(candidate),
  };
}

function candidateContextTags(candidate = {}) {
  return [
    isFreeStater(candidate) ? "Free State Aligned" : "",
    isTpActionAligned(candidate) ? "TPAction Aligned" : "",
  ].filter(Boolean);
}

function seatLabel(group = {}) {
  return cleanText(group.label || [
    group.officeLabel || group.office,
    group.districtLabel,
  ].filter(Boolean).join(", "));
}

function candidateSeatLabel(candidate = {}) {
  const office = normalizedOfficeLabel(candidate.office);
  const isSenate = /state senate|state senator/i.test(office);
  const county = cleanText(candidate.county);
  const district = cleanText(candidate.district);

  return [
    office || "Office",
    isSenate ? "" : county,
    district ? `District ${district}` : "",
  ].filter(Boolean).join(", ");
}

function normalizedOfficeLabel(value = "") {
  const office = cleanText(value);
  if (/state senate|state senator/i.test(office)) return "State Senate";
  if (/state representative|representative/i.test(office)) return "State Representative";
  return office;
}

function candidateOfficeLine(candidate = {}) {
  const office = normalizedOfficeLabel(candidate.office);
  const isSenate = /state senate|state senator/i.test(office);
  const county = isSenate ? "" : cleanText(candidate.county);
  const district = cleanText(candidate.district);

  return [office, county, district ? `District ${district}` : ""]
    .filter(Boolean)
    .join(" · ");
}

function candidateParty(candidate = {}) {
  const party = cleanText(candidate.politicalParty || candidate.political_party || candidate.party);
  const normalized = party.toLowerCase();
  if (normalized === "d" || normalized === "dem") return "Democratic";
  if (normalized === "r" || normalized === "rep") return "Republican";
  if (normalized === "i" || normalized === "ind") return "Independent";
  return party.replace(/\s+Party$/i, "");
}

function candidateTowns(candidate = {}) {
  const towns = [
    candidate.townsRepresented,
    candidate.towns_represented,
    candidate.communitiesRepresented,
    candidate.communities_represented,
    candidate.towns,
    candidate.locationText,
    candidate.location_text,
    candidate.legislatorTownsRepresented,
    candidate.legislatorLocationText,
  ].flatMap(townsFromValue);

  const seen = new Set();
  return towns.filter((town) => {
    const key = town.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).join(" · ");
}

function townsFromValue(value = "") {
  if (Array.isArray(value)) return value.flatMap(townsFromValue);
  if (typeof value === "object" && value !== null) {
    return townsFromValue(value.town || value.name || value.label || "");
  }

  const text = cleanText(value);
  const delimiter = /ward/i.test(text) ? /;|\||\s+and\s+/i : /[,;|]|\s+and\s+/i;
  return text.split(delimiter).map(cleanText).filter(Boolean);
}

function candidateOfficePriority(value = "") {
  const office = cleanText(value).toLowerCase();
  if (/state representative|representative in general court|nh house/.test(office)) return 0;
  if (/state senate|state senator|nh senate/.test(office)) return 1;
  return 2;
}

function numericSortValue(value = "") {
  const number = Number(value);
  return Number.isFinite(number) ? number : 999;
}

function seatId(group = {}, label = "") {
  const source = cleanText(group.id || group.label || label).toLowerCase();
  return source
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "seat";
}

function uniqueShareCandidates(candidates = []) {
  const seen = new Set();

  return candidates.filter((candidate) => {
    const key = cleanText(
      candidate?.filerEntityNumber ||
        candidate?.filer_entity_number ||
        candidate?.personId ||
        candidate?.person_id ||
        candidateSlug(candidate),
    ).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function absoluteUrl(value = "", origin = "") {
  const raw = cleanText(value);
  if (!raw) return "";

  try {
    return new URL(raw, origin || undefined).toString();
  } catch {
    return raw;
  }
}

function cleanText(value = "") {
  return String(value || "").trim();
}

function candidateName(candidate = {}) {
  return cleanText(
    candidate.name ||
      [candidate.candidateFirstName, candidate.candidateLastName]
        .filter(Boolean)
        .join(" "),
  );
}

function candidateSlug(candidate = {}) {
  const value = candidate.slug || [
    candidate.filerEntityNumber || candidate.filer_entity_number,
    candidateName(candidate),
  ].filter(Boolean).join("-");

  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[''`’‘]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}
