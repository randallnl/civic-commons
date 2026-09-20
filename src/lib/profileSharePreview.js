export const PROFILE_SHARE_ORIGIN = "https://nhdeservesbetter.com";
export const PROFILE_SHARE_FALLBACK = `${PROFILE_SHARE_ORIGIN}/nhdb-seo-image.png`;
export const PROFILE_SHARE_WIDTH = 1200;
export const PROFILE_SHARE_HEIGHT = 630;

export function validProfileSlug(slug) {
  return typeof slug === "string" && /^[a-z0-9][a-z0-9-]{0,179}$/.test(slug);
}

export function validCommunityUpdateId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : 0;
}

export function profileShareRevision(updatedAt) {
  return String(updatedAt || "original")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 64);
}

export function profileShareImageUrl(slug, updatedAt) {
  if (!validProfileSlug(slug)) return PROFILE_SHARE_FALLBACK;
  return `${PROFILE_SHARE_ORIGIN}/api/profile-preview/${slug}?v=${profileShareRevision(updatedAt)}`;
}

export function profileShareStorageKey(slug, updatedAt) {
  if (!validProfileSlug(slug)) return "";
  return `profile-share-previews/${slug}/${profileShareRevision(updatedAt)}.jpg`;
}

export function communityUpdateShareImageUrl(slug, updateId, updatedAt) {
  const id = validCommunityUpdateId(updateId);
  if (!validProfileSlug(slug) || !id) return PROFILE_SHARE_FALLBACK;
  return `${PROFILE_SHARE_ORIGIN}/api/profile-preview/${slug}?update=${id}&v=${profileShareRevision(updatedAt)}`;
}

export function communityUpdateShareStorageKey(slug, updateId, updatedAt) {
  const id = validCommunityUpdateId(updateId);
  if (!validProfileSlug(slug) || !id) return "";
  return `community-update-share-previews/${slug}/${id}/${profileShareRevision(updatedAt)}.jpg`;
}
