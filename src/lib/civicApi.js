export const DEFAULT_CIVIC_API_BASE = "https://api.nhciviccommons.com";

export function civicApiBase(...overrides) {
  return (
    overrides.find(Boolean) ||
    import.meta.env.REP_LOOKUP_API_BASE ||
    DEFAULT_CIVIC_API_BASE
  );
}

export function civicApiHeaders(headers = {}, runtimeEnv = {}) {
  const apiKey =
    runtimeEnv.API_ACCESS_KEY ||
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

  return fetch(url, {
    ...fetchOptions,
    headers: civicApiHeaders(fetchOptions.headers, runtimeEnv),
  });
}
