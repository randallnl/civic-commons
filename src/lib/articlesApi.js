import { DEFAULT_CIVIC_API_BASE, civicApiFetch } from "./civicApi";
import { cleanText } from "./text";

export function articlesApiBase() {
  return (
    import.meta.env.ARTICLES_API_BASE ||
    import.meta.env.BILLS_API_BASE ||
    import.meta.env.REP_LOOKUP_API_BASE ||
    DEFAULT_CIVIC_API_BASE
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
  runtimeEnv,
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
  const response = await civicApiFetch(`${apiBase}/articles${query ? `?${query}` : ""}`, {
    runtimeEnv,
  });

  if (!response.ok) {
    throw new Error(`Unable to load articles: ${response.status}`);
  }

  const data = await response.json();

  return {
    ...data,
    articles: (data.articles || data.results || []).map(normalizeArticle),
  };
}

function normalizeArticle(article = {}) {
  return {
    ...article,
    title: cleanText(article.title),
    summary: cleanText(article.summary),
    publisher: cleanText(article.publisher),
    resource_type: cleanText(article.resource_type),
    resourceType: cleanText(article.resourceType),
    towns: cleanRelationList(article.towns, ["town", "name", "label"]),
    bills: cleanRelationList(article.bills, ["condensedbillno", "bill_number", "name", "title"]),
    legislators: cleanRelationList(article.legislators, [
      "matched_name",
      "legislator_name_raw",
      "name",
      "firstname",
      "lastname",
    ]),
    issueAreas: cleanRelationList(article.issueAreas, ["issue_area", "name"]),
  };
}

function cleanRelationList(values, keys = []) {
  if (!Array.isArray(values)) return values;

  return values.map((value) => {
    if (typeof value === "string") return cleanText(value);
    if (!value || typeof value !== "object") return value;

    return {
      ...value,
      ...Object.fromEntries(
        keys
          .filter((key) => typeof value[key] === "string")
          .map((key) => [key, cleanText(value[key])]),
      ),
    };
  });
}
