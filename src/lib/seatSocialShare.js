import { profilePhotoUrl } from "./photos.js";

const DEFAULT_SUGGEST_UPDATE_PATH = "/suggest-update";
const DEFAULT_FALLBACK_PORTRAIT_PATH = "/nhdb-logo-circle.png";

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
    ...candidates.map((candidate) => `${cleanText(candidate.name)}: ${cleanText(candidate.profileUrl)}`),
    "",
    "Do you have verifiable information to share about your candidate? Share it at NH Deserves Better:",
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
  };
}

function seatLabel(group = {}) {
  return cleanText(group.label || [
    group.officeLabel || group.office,
    group.districtLabel,
  ].filter(Boolean).join(", "));
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
