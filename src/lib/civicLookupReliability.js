export async function getCivicData(address, apiKey, {
  fetchImpl = fetch,
  maxAttempts = 2,
  timeoutMs = 3_500,
  sleep = waitForCivicRetry,
} = {}) {
  const civicUrl =
    "https://civicinfo.googleapis.com/civicinfo/v2/divisionsByAddress?address=" +
    encodeURIComponent(address) +
    "&key=" +
    encodeURIComponent(apiKey);

  let lastError;
  const attempts = Math.max(1, Number(maxAttempts) || 1);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort("civic-lookup-timeout"), timeoutMs);
    try {
      const response = await fetchImpl(civicUrl, { signal: controller.signal });
      const data = await response.json().catch(() => ({}));

      if (response.ok) return data;

      const error = new Error(
        data.error?.message || `Google Civic lookup failed (${response.status}).`
      );
      error.status = response.status;
      // A quota response will not clear during a sub-second retry. Fall back to
      // local district data immediately instead of adding more quota pressure.
      error.retryable = response.status >= 500;
      lastError = error;
    } catch (error) {
      error.retryable = true;
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }

    if (!lastError?.retryable || attempt === attempts) break;
    await sleep(attempt * 175);
  }

  throw lastError || new Error("Google Civic lookup failed.");
}

export function hasUsableCivicLocation(data = {}) {
  if (String(data.normalizedInput?.city || "").trim()) return true;
  return Object.keys(data.divisions || {}).some((ocdId) =>
    /\/(?:sldl|sldu|place):/i.test(ocdId)
  );
}

export function matchPlaceNameInAddress(address, townNames = []) {
  const normalizedAddress = ` ${normalizeForPlaceMatch(address)} `;
  const matches = [...new Set(townNames)]
    .map((town) => ({
      town: String(town || "").trim(),
      normalized: normalizeForPlaceMatch(town),
    }))
    .filter(({ normalized }) =>
      normalized && normalizedAddress.includes(` ${normalized} `)
    )
    .sort((a, b) => {
      const positionDelta = normalizedAddress.lastIndexOf(` ${b.normalized} `) -
        normalizedAddress.lastIndexOf(` ${a.normalized} `);
      return positionDelta || b.normalized.length - a.normalized.length;
    });

  return matches[0]?.town || "";
}

function normalizeForPlaceMatch(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function waitForCivicRetry(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
