import {
  PROFILE_SHARE_FALLBACK,
  PROFILE_SHARE_HEIGHT,
  PROFILE_SHARE_ORIGIN,
  PROFILE_SHARE_WIDTH,
  profileShareRevision,
} from "./profileSharePreview.js";
import {
  normalizeRollCallBillCode,
  validRollCallBillCode,
  validRollCallYear,
} from "./rollCallSharePreview.js";

export const BILL_SHARE_FALLBACK = PROFILE_SHARE_FALLBACK;
export const BILL_SHARE_ORIGIN = PROFILE_SHARE_ORIGIN;
export const BILL_SHARE_WIDTH = PROFILE_SHARE_WIDTH;
export const BILL_SHARE_HEIGHT = PROFILE_SHARE_HEIGHT;
export const BILL_SHARE_RENDER_VERSION = "v1";

export const normalizeBillShareCode = normalizeRollCallBillCode;
export const validBillShareCode = validRollCallBillCode;
export const validBillShareYear = validRollCallYear;

export function billShareRevision(value) {
  return `${BILL_SHARE_RENDER_VERSION}-${profileShareRevision(value)}`;
}

export function billShareImageUrl(billCode, year, revision) {
  const bill = normalizeBillShareCode(billCode);
  const sessionYear = validBillShareYear(year);
  if (!validBillShareCode(bill) || !sessionYear) return BILL_SHARE_FALLBACK;

  const params = new URLSearchParams({
    year: sessionYear,
    v: billShareRevision(revision || sessionYear),
  });
  return `${BILL_SHARE_ORIGIN}/api/bill-preview/${bill}?${params}`;
}

export function billShareStorageKey(billCode, year, revision) {
  const bill = normalizeBillShareCode(billCode);
  const sessionYear = validBillShareYear(year);
  if (!validBillShareCode(bill) || !sessionYear) return "";

  return `bill-share-previews/${sessionYear}/${bill}/${billShareRevision(
    revision || sessionYear,
  )}.jpg`;
}
