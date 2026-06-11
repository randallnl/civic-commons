const DEFAULT_API_BASE = "https://api.nhciviccommons.com";

export function repsApiBase() {
  return import.meta.env.REP_LOOKUP_API_BASE || DEFAULT_API_BASE;
}

export async function getRepresentatives({
  apiBase = repsApiBase(),
  q = "",
  chamber = "",
  include = "",
  limit = 200,
  offset = 0,
} = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (chamber) params.set("chamber", chamber);
  if (include) params.set("include", include);
  if (limit) params.set("limit", String(limit));
  if (offset) params.set("offset", String(offset));

  const query = params.toString();
  const response = await fetch(`${apiBase}/reps${query ? `?${query}` : ""}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error("Representative directory is unavailable.");
  }

  if (data.error || data.message || data.status === "error") {
    throw new Error("Representative directory is unavailable.");
  }

  return {
    ...data,
    representatives:
      data.representatives ||
      data.reps ||
      data.people ||
      data.results ||
      [],
  };
}

export async function getRepresentative(slugOrId, { apiBase = repsApiBase() } = {}) {
  const response = await fetch(`${apiBase}/reps/${encodeURIComponent(slugOrId)}`);

  if (!response.ok) {
    throw new Error(`Unable to load representative: ${response.status}`);
  }

  return response.json();
}

export function repName(rep = {}) {
  return rep.name || [rep.firstname, rep.lastname].filter(Boolean).join(" ");
}

export function repSlug(rep = {}) {
  const value = rep.slug || repName(rep);
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
