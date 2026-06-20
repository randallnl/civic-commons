const DEFAULT_PREVIEW_API_BASE = "https://article-preview.randall-d53.workers.dev";

function previewApiBase() {
  return import.meta.env.ARTICLE_PREVIEW_API_BASE || DEFAULT_PREVIEW_API_BASE;
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

    const preview = await response.json();
    return preview && typeof preview === "object" ? preview : null;
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
