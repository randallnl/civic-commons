const DEFAULT_API_BASE = "https://api.nhdeservesbetter.com";

let billsCache = new Map();

export function billApiBase() {
  return (
    import.meta.env.BILLS_API_BASE ||
    import.meta.env.REP_LOOKUP_API_BASE ||
    DEFAULT_API_BASE
  );
}

export function billDetailPath(code, year) {
  const billCode = encodeURIComponent(normalizeBillCodeForUrl(code));
  const params = year ? `?year=${encodeURIComponent(year)}` : "";
  return `/bills/${billCode}${params}`;
}

export function rollCallPath(code, sequence, year) {
  const billCode = encodeURIComponent(normalizeBillCodeForUrl(code));
  const params = year ? `?year=${encodeURIComponent(year)}` : "";
  return `/bills/${billCode}/roll-calls/${encodeURIComponent(sequence)}${params}`;
}

export function normalizeBillCodeForUrl(code = "") {
  return String(code).toUpperCase().replace(/\s+/g, "");
}

export async function getBills({
  apiBase = billApiBase(),
  q = "",
  year = "",
  limit = 100,
  offset = 0,
} = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (year) params.set("year", year);
  if (limit) params.set("limit", String(limit));
  if (offset) params.set("offset", String(offset));

  const query = params.toString();
  const response = await fetch(`${apiBase}/bills${query ? `?${query}` : ""}`);

  if (!response.ok) {
    throw new Error(`Unable to load bills: ${response.status}`);
  }

  return response.json();
}

export async function getBillSummaries(options = {}) {
  const cacheKey = JSON.stringify(options);
  if (billsCache.has(cacheKey)) return billsCache.get(cacheKey);

  const data = await getBills(options);
  const summaries = new Map(
    (data.bills || []).map((bill) => [
      normalizeBillCodeForUrl(bill.condensedbillno),
      bill,
    ]),
  );

  billsCache.set(cacheKey, summaries);
  return summaries;
}

export async function getBillDetail(code, {
  apiBase = billApiBase(),
  year = "",
} = {}) {
  const params = new URLSearchParams();
  if (year) params.set("year", year);

  const response = await fetch(
    `${apiBase}/bills/${encodeURIComponent(normalizeBillCodeForUrl(code))}?${params}`,
  );

  if (!response.ok) {
    throw new Error(`Unable to load bill: ${response.status}`);
  }

  return response.json();
}

export async function getBillTestimony(code, {
  apiBase = billApiBase(),
  year = "",
} = {}) {
  const params = new URLSearchParams();
  if (year) params.set("year", year);

  const response = await fetch(
    `${apiBase}/bills/${encodeURIComponent(
      normalizeBillCodeForUrl(code),
    )}/testimony?${params}`,
  );

  if (!response.ok) {
    throw new Error(`Unable to load testimony: ${response.status}`);
  }

  return response.json();
}

export async function getRollCallVotes(code, sequence, {
  apiBase = billApiBase(),
  year = "",
} = {}) {
  const params = new URLSearchParams();
  if (year) params.set("year", year);

  const response = await fetch(
    `${apiBase}/bills/${encodeURIComponent(
      normalizeBillCodeForUrl(code),
    )}/roll-calls/${encodeURIComponent(sequence)}?${params}`,
  );

  if (!response.ok) {
    throw new Error(`Unable to load roll call votes: ${response.status}`);
  }

  return response.json();
}

export function positionCounts(bill = {}) {
  return {
    support: Number(bill.support_count || 0),
    oppose: Number(bill.oppose_count || 0),
    neutral: Number(bill.neutral_count || 0),
    total: Number(bill.testimony_count || 0),
  };
}
