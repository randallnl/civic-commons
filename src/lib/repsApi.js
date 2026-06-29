import { DEFAULT_CIVIC_API_BASE, civicApiFetch } from "./civicApi";

export function repsApiBase() {
  return import.meta.env.REP_LOOKUP_API_BASE || DEFAULT_CIVIC_API_BASE;
}

export async function getRepresentatives({
  apiBase = repsApiBase(),
  q = "",
  body = "",
  chamber = "",
  county = "",
  district = "",
  include = "",
  limit = 200,
  offset = 0,
  runtimeEnv,
} = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (body) params.set("body", body);
  if (chamber) params.set("chamber", chamber);
  if (county) params.set("county", county);
  if (district) params.set("district", district);
  if (include) params.set("include", include);
  if (limit) params.set("limit", String(limit));
  if (offset) params.set("offset", String(offset));

  const query = params.toString();
  const response = await civicApiFetch(`${apiBase}/reps${query ? `?${query}` : ""}`, {
    runtimeEnv,
  });
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

export async function getRepresentative(slugOrId, {
  apiBase = repsApiBase(),
  runtimeEnv,
} = {}) {
  const response = await civicApiFetch(`${apiBase}/reps/${encodeURIComponent(slugOrId)}`, {
    runtimeEnv,
  });

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
