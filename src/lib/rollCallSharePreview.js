import {
  PROFILE_SHARE_FALLBACK,
  PROFILE_SHARE_HEIGHT,
  PROFILE_SHARE_ORIGIN,
  PROFILE_SHARE_WIDTH,
  profileShareRevision,
} from "./profileSharePreview.js";

export const ROLL_CALL_SHARE_FALLBACK = PROFILE_SHARE_FALLBACK;
export const ROLL_CALL_SHARE_ORIGIN = PROFILE_SHARE_ORIGIN;
export const ROLL_CALL_SHARE_WIDTH = PROFILE_SHARE_WIDTH;
export const ROLL_CALL_SHARE_HEIGHT = PROFILE_SHARE_HEIGHT;
export const ROLL_CALL_SHARE_RENDER_VERSION = "v2";

export function normalizeRollCallBillCode(value = "") {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

export function validRollCallBillCode(value) {
  return /^[A-Z]{1,5}\d{1,6}(?:-[A-Z0-9]{1,12})?$/.test(normalizeRollCallBillCode(value));
}

export function validRollCallSequence(value) {
  const sequence = Number(value);
  return Number.isSafeInteger(sequence) && sequence > 0 && sequence <= 999999
    ? String(sequence)
    : "";
}

export function validRollCallYear(value) {
  const year = Number(value);
  return Number.isSafeInteger(year) && year >= 2000 && year <= 2100
    ? String(year)
    : "";
}

export function rollCallShareRevision(value) {
  return `${ROLL_CALL_SHARE_RENDER_VERSION}-${profileShareRevision(value)}`;
}

export function rollCallShareImageUrl(billCode, sequence, year, revision) {
  const bill = normalizeRollCallBillCode(billCode);
  const voteSequence = validRollCallSequence(sequence);
  const sessionYear = validRollCallYear(year);
  if (!validRollCallBillCode(bill) || !voteSequence || !sessionYear) {
    return ROLL_CALL_SHARE_FALLBACK;
  }

  const params = new URLSearchParams({
    year: sessionYear,
    v: rollCallShareRevision(revision || sessionYear),
  });
  return `${ROLL_CALL_SHARE_ORIGIN}/api/roll-call-preview/${bill}/${voteSequence}?${params}`;
}

export function rollCallShareStorageKey(billCode, sequence, year, revision) {
  const bill = normalizeRollCallBillCode(billCode);
  const voteSequence = validRollCallSequence(sequence);
  const sessionYear = validRollCallYear(year);
  if (!validRollCallBillCode(bill) || !voteSequence || !sessionYear) return "";

  return `roll-call-share-previews/${sessionYear}/${bill}/${voteSequence}/${rollCallShareRevision(
    revision || sessionYear,
  )}.jpg`;
}
