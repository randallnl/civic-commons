import { env } from "cloudflare:workers";

const REPORT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function reportDownloadsDb() {
  return env.d1_db;
}

export async function getReportDownloads(reportSlug, db = reportDownloadsDb()) {
  const normalizedReportSlug = normalizeSlug(reportSlug);
  if (!normalizedReportSlug || !db) return [];

  const result = await db
    .prepare(
      `SELECT slug, report_slug, title, description, category,
              fiscal_year_start, fiscal_year_end, original_filename,
              content_type, byte_size, sha256, sort_order, source_name,
              source_url
       FROM report_downloads
       WHERE report_slug = ? AND published = 1
       ORDER BY sort_order, title COLLATE NOCASE`,
    )
    .bind(normalizedReportSlug)
    .all();

  return (result.results || []).map(normalizeDownloadRow);
}

export async function getReportDownload(slug, db = reportDownloadsDb()) {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug || !db) return null;

  return db
    .prepare(
      `SELECT slug, report_slug, title, original_filename, object_key,
              content_type, byte_size, sha256
       FROM report_downloads
       WHERE slug = ? AND published = 1
       LIMIT 1`,
    )
    .bind(normalizedSlug)
    .first();
}

export function reportDownloadPath(slug) {
  const normalizedSlug = normalizeSlug(slug);
  return normalizedSlug ? `/downloads/${normalizedSlug}` : "";
}

export function formatByteSize(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeSlug(value = "") {
  const slug = String(value).trim().toLowerCase();
  return REPORT_SLUG_PATTERN.test(slug) ? slug : "";
}

function normalizeDownloadRow(row = {}) {
  return {
    slug: String(row.slug || ""),
    reportSlug: String(row.report_slug || ""),
    title: String(row.title || ""),
    description: String(row.description || ""),
    category: String(row.category || ""),
    fiscalYearStart: row.fiscal_year_start,
    fiscalYearEnd: row.fiscal_year_end,
    originalFilename: String(row.original_filename || ""),
    contentType: String(row.content_type || "application/octet-stream"),
    byteSize: Number(row.byte_size || 0),
    sha256: String(row.sha256 || ""),
    sortOrder: Number(row.sort_order || 0),
    sourceName: String(row.source_name || ""),
    sourceUrl: String(row.source_url || ""),
  };
}
