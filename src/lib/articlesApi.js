const DEFAULT_API_BASE = "https://api.nhdeservesbetter.com";

export function articlesApiBase() {
  return (
    import.meta.env.ARTICLES_API_BASE ||
    import.meta.env.BILLS_API_BASE ||
    import.meta.env.REP_LOOKUP_API_BASE ||
    DEFAULT_API_BASE
  );
}

export async function getArticles({
  apiBase = articlesApiBase(),
  q = "",
  bill = "",
  town = "",
  personid = "",
  employeeno = "",
  issue = "",
  impact = "",
  resourceType = "",
  include = "",
  limit = 50,
  offset = 0,
} = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (bill) params.set("bill", bill);
  if (town) params.set("town", town);
  if (personid) params.set("personid", String(personid));
  if (employeeno) params.set("employeeno", String(employeeno));
  if (issue) params.set("issue", issue);
  if (impact) params.set("impact", impact);
  if (resourceType) params.set("resourceType", resourceType);
  if (include) params.set("include", include);
  if (limit) params.set("limit", String(limit));
  if (offset) params.set("offset", String(offset));

  const query = params.toString();
  const response = await fetch(`${apiBase}/articles${query ? `?${query}` : ""}`);

  if (!response.ok) {
    throw new Error(`Unable to load articles: ${response.status}`);
  }

  return response.json();
}
