import { env } from "cloudflare:workers";
import { cleanText } from "./text";

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
  return typeof value === "string" ? cleanText(value).replace(/\s+/g, " ").trim() : "";
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

export async function getArticlePreview(articleUrl, apiBase = previewApiBase()) {
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
  const cachedArticles = articleList.slice(0, limit).filter((article) => cachedPreview(article));
  const uncachedArticles = articleList
    .slice(0, limit)
    .filter((article) => article?.url && !cachedPreview(article));
  const urls = [...new Set(uncachedArticles.map((article) => article.url))];

  cachedArticles.forEach((article) => previews.set(article.url, cachedPreview(article)));

  // Keep the scraper responsive without opening a request for every article at once.
  for (let index = 0; index < urls.length; index += 6) {
    const batch = urls.slice(index, index + 6);
    const results = await Promise.all(batch.map((url) => getArticlePreview(url)));
    await Promise.all(
      batch.map((url, resultIndex) => {
        const preview = results[resultIndex];
        previews.set(url, preview);
        const article = uncachedArticles.find((item) => item.url === url);
        return saveArticlePreview(article, preview);
      }),
    );
  }

  return articleList.map((article) => ({
    ...article,
    preview: previews.get(article?.url) || cachedPreview(article) || null,
  }));
}

export function cachedPreview(article = {}) {
  return normalizePreview(
    article.preview || {
      title: article.preview_title || article.previewTitle,
      description: article.preview_description || article.previewDescription,
      imageUrl: article.preview_image_url || article.previewImageUrl,
    },
  );
}

async function saveArticlePreview(article = {}, preview = null) {
  const db = env.d1_db;
  const articleId = article?.article_id || article?.articleId;
  const normalized = normalizePreview(preview);

  if (!db || !articleId || !normalized) return;

  try {
    await ensureArticlePreviewColumns(db);
    await db
      .prepare(
        `UPDATE d1_articles
         SET preview_title = ?,
             preview_description = ?,
             preview_image_url = ?,
             preview_fetched_at = CURRENT_TIMESTAMP
         WHERE article_id = ?`,
      )
      .bind(
        normalized.title,
        normalized.description,
        normalized.imageUrl,
        String(articleId),
      )
      .run();
  } catch (error) {
    console.warn(`Unable to cache article preview: ${articleId}`, error?.message || error);
  }
}

export async function ensureArticlePreviewColumns(db = env.d1_db) {
  if (!db) return;

  const columns = await db.prepare("PRAGMA table_info(d1_articles)").all();
  const existing = new Set((columns.results || []).map((column) => column.name));

  for (const [column, definition] of [
    ["preview_title", "TEXT"],
    ["preview_description", "TEXT"],
    ["preview_image_url", "TEXT"],
    ["preview_fetched_at", "TEXT"],
  ]) {
    if (!existing.has(column)) {
      await db.prepare(`ALTER TABLE d1_articles ADD COLUMN ${column} ${definition}`).run();
    }
  }
}
