import { DEFAULT_CIVIC_API_BASE, civicApiFetch } from "./civicApi";
import { parseArticle } from "./schemas";
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
  candidate = "",
  filerEntityNumber = "",
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
  if (candidate) params.set("candidate", String(candidate));
  if (filerEntityNumber) params.set("filerEntityNumber", String(filerEntityNumber));
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

export async function getArticle(articleId, {
  apiBase = articlesApiBase(),
  runtimeEnv,
} = {}) {
  const response = await civicApiFetch(
    `${apiBase}/articles/${encodeURIComponent(articleId)}`,
    { runtimeEnv },
  );

  if (!response.ok) {
    throw new Error(`Unable to load article: ${response.status}`);
  }

  const data = await response.json();
  return {
    ...data,
    article: data.article ? normalizeArticle(data.article) : null,
  };
}

export function articleDetailPath(article = {}) {
  return article.article_id || article.articleId
    ? `/articles/${encodeURIComponent(article.article_id || article.articleId)}`
    : article.url || "/articles";
}

function normalizeArticle(article = {}) {
  const parsedArticle = parseArticle(article);
  const preview = normalizeArticlePreview(parsedArticle);

  return {
    ...parsedArticle,
    title: cleanText(parsedArticle.title),
    summary: cleanText(parsedArticle.summary),
    publisher: cleanText(parsedArticle.publisher),
    source: cleanText(parsedArticle.source),
    publication: cleanText(parsedArticle.publication),
    domain: cleanText(parsedArticle.domain),
    resource_type: cleanText(parsedArticle.resource_type),
    resourceType: cleanText(parsedArticle.resourceType),
    towns: cleanRelationList(parsedArticle.towns, ["town", "name", "label"]),
    bills: cleanRelationList(parsedArticle.bills, ["condensedbillno", "bill_number", "name", "title"]),
    legislators: cleanRelationList(parsedArticle.legislators, [
      "matched_name",
      "legislator_name_raw",
      "name",
      "firstname",
      "lastname",
    ]),
    candidates: cleanRelationList(parsedArticle.candidates, [
      "candidate_name_raw",
      "name",
      "candidate_first_name",
      "candidate_last_name",
    ]),
    issueAreas: cleanRelationList(parsedArticle.issueAreas, ["issue_area", "name"]),
    impactTypes: cleanRelationList(parsedArticle.impactTypes, ["impact_type", "name"]),
    preview,
  };
}

function normalizeArticlePreview(article = {}) {
  const preview =
    article.preview && typeof article.preview === "object"
      ? article.preview
      : {
          title: article.preview_title || article.previewTitle,
          description: article.preview_description || article.previewDescription,
          imageUrl: article.preview_image_url || article.previewImageUrl,
        };

  const normalized = {
    title: cleanText(preview.title || ""),
    description: cleanText(preview.description || ""),
    imageUrl: cleanText(preview.imageUrl || ""),
  };

  return Object.values(normalized).some(Boolean) ? normalized : null;
}

export function articlePublishDate(article = {}) {
  const value =
    article.published_at ||
    article.publishedAt ||
    article.published_date ||
    article.publishedDate ||
    article.publish_date ||
    article.publishDate ||
    article.date ||
    article.article_date ||
    article.articleDate ||
    article.created_at ||
    article.createdAt ||
    article.updated_at ||
    article.updatedAt;

  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return cleanText(value);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function articleSourceName(article = {}) {
  return cleanText(
    article.publisher ||
      article.source ||
      article.publication ||
      article.source_name ||
      article.sourceName ||
      article.domain ||
      domainFromUrl(article.url) ||
      "",
  );
}

function domainFromUrl(value = "") {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
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
  }).filter((value) => !isNumericOnlyRelation(value, keys));
}

function isNumericOnlyRelation(value, keys = []) {
  if (typeof value === "string") return isNumericOnlyTag(value);
  if (!value || typeof value !== "object") return false;

  const labels = keys
    .map((key) => value[key])
    .filter((label) => typeof label === "string" && label.trim());

  return labels.length > 0 && labels.every(isNumericOnlyTag);
}

function isNumericOnlyTag(value = "") {
  return /^\d+$/.test(String(value || "").trim());
}
