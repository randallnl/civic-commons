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
  const preview = normalizeArticlePreview(article);

  return {
    ...article,
    title: cleanText(article.title),
    summary: cleanText(article.summary),
    publisher: cleanText(article.publisher),
    source: cleanText(article.source),
    publication: cleanText(article.publication),
    domain: cleanText(article.domain),
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
    candidates: cleanRelationList(article.candidates, [
      "candidate_name_raw",
      "name",
      "candidate_first_name",
      "candidate_last_name",
    ]),
    issueAreas: cleanRelationList(article.issueAreas, ["issue_area", "name"]),
    impactTypes: cleanRelationList(article.impactTypes, ["impact_type", "name"]),
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
  });
}
