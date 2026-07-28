import { env } from "cloudflare:workers";
import nhCivicsApiWorker from "./nhCivicsApiWorker";

export const DEFAULT_CIVIC_API_BASE = "https://api.nhciviccommons.com";
const LOCAL_API_ORIGINS = new Set([
  "https://api.nhciviccommons.com",
  "https://api.nhdeservesbetter.com",
]);

export function civicApiBase(...overrides) {
  return (
    overrides.find(Boolean) ||
    import.meta.env.REP_LOOKUP_API_BASE ||
    DEFAULT_CIVIC_API_BASE
  );
}

export function civicApiHeaders(headers = {}, runtimeEnv = {}) {
  const apiKey =
    env.API_ACCESS_KEY ||
    runtimeEnv.API_ACCESS_KEY ||
    env.CIVIC_API_KEY ||
    runtimeEnv.CIVIC_API_KEY ||
    import.meta.env.API_ACCESS_KEY ||
    import.meta.env.CIVIC_API_KEY ||
    "";
  const requestHeaders = new Headers(headers);

  if (apiKey && !requestHeaders.has("x-api-key")) {
    requestHeaders.set("x-api-key", apiKey);
  }

  return requestHeaders;
}

export function civicApiFetch(url, options = {}) {
  const { runtimeEnv, civicCacheTtl, ...fetchOptions } = options;
  const requestUrl = new URL(url);
  const headers = civicApiHeaders(fetchOptions.headers, runtimeEnv);
  const method = String(fetchOptions.method || "GET").toUpperCase();
  const cacheTtl = cacheTtlForCivicApiRequest(requestUrl, {
    method,
    override: civicCacheTtl,
    cacheMode: fetchOptions.cache,
  });

  if (cacheTtl) {
    return cachedCivicApiFetch(requestUrl, {
      fetchOptions,
      headers,
      runtimeEnv,
      ttl: cacheTtl,
    });
  }

  return uncachedCivicApiFetch(requestUrl, {
    fetchOptions,
    headers,
    runtimeEnv,
  });
}

function uncachedCivicApiFetch(requestUrl, { fetchOptions = {}, headers, runtimeEnv } = {}) {
  if (LOCAL_API_ORIGINS.has(requestUrl.origin)) {
    return nhCivicsApiWorker.fetch(
      new Request(requestUrl.toString(), {
        ...fetchOptions,
        headers,
      }),
      localCivicApiEnv(runtimeEnv),
    );
  }

  return fetch(requestUrl.toString(), {
    ...fetchOptions,
    headers,
  });
}

async function cachedCivicApiFetch(requestUrl, { fetchOptions = {}, headers, runtimeEnv, ttl } = {}) {
  if (typeof caches === "undefined" || !caches.default) {
    return uncachedCivicApiFetch(requestUrl, { fetchOptions, headers, runtimeEnv });
  }

  const cache = caches.default;
  const cacheKey = new Request(normalizedCacheUrl(requestUrl), { method: "GET" });
  const cached = await cache.match(cacheKey);

  if (cached) {
    return withCacheStatus(cached, "HIT");
  }

  const response = await uncachedCivicApiFetch(requestUrl, {
    fetchOptions,
    headers,
    runtimeEnv,
  });

  if (!response.ok || !isJsonResponse(response)) {
    return response;
  }

  const body = await response.clone().arrayBuffer();
  const cachedResponse = responseWithCacheHeaders(response, body, ttl);
  await cache.put(cacheKey, cachedResponse.clone());

  return withCacheStatus(cachedResponse, "MISS");
}

function cacheTtlForCivicApiRequest(url, { method = "GET", override, cacheMode } = {}) {
  if (override === false || cacheMode === "no-store") return 0;
  if (Number(override) > 0) return Number(override);
  if (method !== "GET") return 0;
  if (!LOCAL_API_ORIGINS.has(url.origin)) return 0;

  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path === "/reps/lookup") return 0;

  if (path === "/articles" || path.startsWith("/articles/")) return 10 * 60;
  if (path === "/communities" || path.startsWith("/communities/")) return 15 * 60;
  if (path === "/candidates" || path.startsWith("/candidates/")) return 10 * 60;
  if (path === "/reps" || path.startsWith("/reps/")) return 10 * 60;
  if (path === "/bills" || path.startsWith("/bills/")) return 15 * 60;

  return 0;
}

function normalizedCacheUrl(url) {
  const cacheUrl = new URL(url.toString());
  cacheUrl.searchParams.sort();
  return cacheUrl.toString();
}

function isJsonResponse(response) {
  return (response.headers.get("content-type") || "").toLowerCase().includes("json");
}

function responseWithCacheHeaders(response, body, ttl) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", `public, max-age=${ttl}, s-maxage=${ttl}`);
  headers.set("X-NHDB-Cache-TTL", String(ttl));
  headers.delete("Set-Cookie");

  return new Response(body.slice(0), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function withCacheStatus(response, status) {
  const headers = new Headers(response.headers);
  headers.set("X-NHDB-Cache", status);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function localCivicApiEnv(runtimeEnv = {}) {
  const database = runtimeEnv.d1_db || env.d1_db || runtimeEnv.DB || env.DB;

  return {
    ...runtimeEnv,
    DB: database,
    d1_db: database,
    CIVIC_COMMONS_DB:
      runtimeEnv.CIVIC_COMMONS_DB ||
      env.CIVIC_COMMONS_DB ||
      database,
    LEGISLATOR_PHOTOS:
      runtimeEnv.LEGISLATOR_PHOTOS ||
      env.LEGISLATOR_PHOTOS ||
      runtimeEnv.r2_bucket ||
      env.r2_bucket,
    API_ACCESS_KEY:
      runtimeEnv.API_ACCESS_KEY ||
      env.API_ACCESS_KEY ||
      runtimeEnv.CIVIC_API_KEY ||
      env.CIVIC_API_KEY,
    CIVIC_API_KEY:
      runtimeEnv.CIVIC_API_KEY ||
      env.CIVIC_API_KEY,
    BILL_TRACKER_TABLE:
      runtimeEnv.BILL_TRACKER_TABLE ||
      env.BILL_TRACKER_TABLE,
    SPOTLIGHT_TRACKER:
      runtimeEnv.SPOTLIGHT_TRACKER ||
      env.SPOTLIGHT_TRACKER,
    ADMIN_SECRET:
      runtimeEnv.ADMIN_SECRET ||
      env.ADMIN_SECRET,
  };
}
