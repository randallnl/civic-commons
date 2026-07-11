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
  const { runtimeEnv, ...fetchOptions } = options;
  const requestUrl = new URL(url);
  const headers = civicApiHeaders(fetchOptions.headers, runtimeEnv);

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
