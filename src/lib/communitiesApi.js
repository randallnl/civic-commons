const DEFAULT_API_BASE = "https://api.nhciviccommons.com";

export function communitiesApiBase() {
  return (
    import.meta.env.COMMUNITIES_API_BASE ||
    import.meta.env.REP_LOOKUP_API_BASE ||
    DEFAULT_API_BASE
  );
}

export async function getCommunities({
  apiBase = communitiesApiBase(),
  q = "",
  body = "house",
  limit = 25,
  offset = 0,
  articleLimit = 3,
} = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (body) params.set("body", body);
  if (limit) params.set("limit", String(limit));
  if (offset) params.set("offset", String(offset));
  if (articleLimit) params.set("articleLimit", String(articleLimit));

  const query = params.toString();
  const response = await fetch(`${apiBase}/communities${query ? `?${query}` : ""}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error || data.message || data.status === "error") {
    throw new Error("Communities are temporarily unavailable.");
  }

  return {
    ...data,
    communities:
      data.communities ||
      data.districts ||
      data.results ||
      [],
  };
}
