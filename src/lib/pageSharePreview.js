import {
  PROFILE_SHARE_FALLBACK,
  PROFILE_SHARE_HEIGHT,
  PROFILE_SHARE_ORIGIN,
  PROFILE_SHARE_WIDTH,
} from "./profileSharePreview.js";

export const PAGE_SHARE_FALLBACK = PROFILE_SHARE_FALLBACK;
export const PAGE_SHARE_ORIGIN = PROFILE_SHARE_ORIGIN;
export const PAGE_SHARE_WIDTH = PROFILE_SHARE_WIDTH;
export const PAGE_SHARE_HEIGHT = PROFILE_SHARE_HEIGHT;

const PAGE_SHARE_CONFIG = Object.freeze({
  "free-staters": Object.freeze({
    path: "/free-staters",
    revision: "v1-2026-10-15-history",
    selector: ".free-staters-share-shell .history-evidence",
  }),
});

export function pageShareConfig(pageKey) {
  return PAGE_SHARE_CONFIG[pageKey] || null;
}

export function validPageShareKey(pageKey) {
  return Boolean(pageShareConfig(pageKey));
}

export function pageShareImageUrl(pageKey) {
  const config = pageShareConfig(pageKey);
  if (!config) return PAGE_SHARE_FALLBACK;

  const params = new URLSearchParams({ v: config.revision });
  return `${PAGE_SHARE_ORIGIN}/api/page-preview/${pageKey}?${params}`;
}

export function pageShareStorageKey(pageKey) {
  const config = pageShareConfig(pageKey);
  if (!config) return "";
  return `page-share-previews/${pageKey}/${config.revision}.jpg`;
}

export function pageShareTargetUrl(pageKey) {
  const config = pageShareConfig(pageKey);
  if (!config) return "";

  const target = new URL(config.path, PAGE_SHARE_ORIGIN);
  target.searchParams.set("share-preview", "1");
  return target.toString();
}
