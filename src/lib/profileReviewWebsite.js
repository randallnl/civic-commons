// A public Facebook page satisfies the website requirement for profile review,
// while remaining in its own social-link field on the profile.
export const MISSING_REVIEW_WEBSITE_SQL =
  "COALESCE(NULLIF(TRIM(candidate_website), ''), NULLIF(TRIM(facebook_url), '')) IS NULL";

export function hasReviewWebsite({ candidate_website, facebook_url } = {}) {
  return Boolean(String(candidate_website || "").trim() || String(facebook_url || "").trim());
}
