const DEFAULT_PREVIEW_API_BASE = "https://article-preview.randall-d53.workers.dev";
const BLOCKED_PREVIEW_PATTERNS = [
  /\berror\s*\d{3}\b/i,
  /\baccess denied\b/i,
  /\battention required\b/i,
  /\bbot detection\b/i,
  /\bforbidden\b/i,
  /\bjust a moment\b/i,
  /\brequest rejected\b/i,
  /\bsecurity check\b/i,
  /\bsite not available\b/i,
  /\bverify you are human\b/i,
];

function previewApiBase() {
  return import.meta.env?.ARTICLE_PREVIEW_API_BASE || DEFAULT_PREVIEW_API_BASE;
}

function usableText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isBlockedPreview(preview = {}) {
  if (Number(preview.status) >= 400) return true;

  return [preview.error, preview.title]
    .map(usableText)
    .some((text) => BLOCKED_PREVIEW_PATTERNS.some((pattern) => pattern.test(text)));
}

function normalizePreview(preview) {
  if (!preview || typeof preview !== "object" || isBlockedPreview(preview)) return null;

  const normalized = {
    title: usableText(preview.title),
    description: usableText(preview.description),
    imageUrl: usableText(preview.imageUrl),
  };

  return Object.values(normalized).some(Boolean) ? normalized : null;
}

async function getArticlePreview(articleUrl, apiBase = previewApiBase()) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(`${apiBase}/preview`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: articleUrl }),
      signal: controller.signal,
    });

    if (!response.ok) return null;

    return normalizePreview(await response.json());
  } catch (error) {
    console.warn(`Unable to preview article: ${articleUrl}`, error?.message || error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function enrichArticlesWithPreviews(articles = [], { limit = 20 } = {}) {
  const articleList = Array.isArray(articles) ? articles : [];
  const previews = new Map();
  const urls = [...new Set(articleList.slice(0, limit).map((article) => article?.url).filter(Boolean))];

  // Keep the scraper responsive without opening a request for every article at once.
  for (let index = 0; index < urls.length; index += 6) {
    const batch = urls.slice(index, index + 6);
    const results = await Promise.all(batch.map((url) => getArticlePreview(url)));
    batch.forEach((url, resultIndex) => previews.set(url, results[resultIndex]));
  }

  return articleList.map((article) => ({
    ...article,
    preview: previews.get(article?.url) || null,
  }));
}
