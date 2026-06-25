import { DEFAULT_CIVIC_API_BASE, civicApiFetch } from "./civicApi";

export function communitiesApiBase() {
  return (
    import.meta.env.COMMUNITIES_API_BASE ||
    import.meta.env.REP_LOOKUP_API_BASE ||
    DEFAULT_CIVIC_API_BASE
  );
}

export async function getCommunities({
  apiBase = communitiesApiBase(),
  q = "",
  body = "house",
  limit = 25,
  offset = 0,
  articleLimit = 3,
  runtimeEnv,
} = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (body) params.set("body", body);
  if (limit) params.set("limit", String(limit));
  if (offset) params.set("offset", String(offset));
  if (articleLimit) params.set("articleLimit", String(articleLimit));

  const query = params.toString();
  const response = await civicApiFetch(`${apiBase}/communities${query ? `?${query}` : ""}`, {
    runtimeEnv,
  });
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

export async function getHouseCommunity(county, district, {
  apiBase = communitiesApiBase(),
  articleLimit = 10,
  runtimeEnv,
} = {}) {
  const params = new URLSearchParams();
  if (articleLimit) params.set("articleLimit", String(articleLimit));

  const response = await civicApiFetch(
    `${apiBase}/communities/house/${encodeURIComponent(
      county,
    )}/${encodeURIComponent(district)}?${params}`,
    { runtimeEnv },
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error || data.message || data.status === "error") {
    throw new Error("Community profile is temporarily unavailable.");
  }

  return data;
}

export async function getSenateCommunity(district, {
  apiBase = communitiesApiBase(),
  articleLimit = 10,
  runtimeEnv,
} = {}) {
  const params = new URLSearchParams();
  if (articleLimit) params.set("articleLimit", String(articleLimit));

  const response = await civicApiFetch(
    `${apiBase}/communities/senate/${encodeURIComponent(district)}?${params}`,
    { runtimeEnv },
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error || data.message || data.status === "error") {
    throw new Error("Community profile is temporarily unavailable.");
  }

  return data;
}

export async function getCountyCommunity(county, {
  apiBase = communitiesApiBase(),
  body = "",
  articleLimit = 3,
  runtimeEnv,
} = {}) {
  const params = new URLSearchParams();
  if (body) params.set("body", body);
  if (articleLimit) params.set("articleLimit", String(articleLimit));

  const response = await civicApiFetch(
    `${apiBase}/communities/counties/${encodeURIComponent(county)}?${params}`,
    { runtimeEnv },
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error || data.message || data.status === "error") {
    throw new Error("County community data is temporarily unavailable.");
  }

  return data;
}

export async function getTownCommunity(town, {
  apiBase = communitiesApiBase(),
  articleLimit = 10,
  runtimeEnv,
} = {}) {
  const params = new URLSearchParams();
  if (articleLimit) params.set("articleLimit", String(articleLimit));

  const response = await civicApiFetch(
    `${apiBase}/communities/towns/${encodeURIComponent(town)}?${params}`,
    { runtimeEnv },
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error || data.message || data.status === "error") {
    throw new Error("Town community data is temporarily unavailable.");
  }

  return data;
}

export function communityPath(community = {}) {
  if (community.path) return community.path;

  const body = String(community.body || community.chamber || "").toLowerCase();
  const district = community.district || community.raw_district || "";

  if (body === "senate" || body === "s") {
    return `/communities/senate/${encodeURIComponent(district)}`;
  }

  const county =
    community.county ||
    community.county_slug ||
    String(community.slug || "").split("-").slice(0, -1).join("-") ||
    "";

  return `/communities/house/${encodeURIComponent(
    String(county).toLowerCase(),
  )}/${encodeURIComponent(district)}`;
}
