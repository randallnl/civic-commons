import { env } from "cloudflare:workers";
import { getArticlePreview } from "./articlePreviews";
import { cleanText } from "./text";

const TABLE_SQL = `CREATE TABLE IF NOT EXISTS article_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  title TEXT,
  summary TEXT,
  publisher TEXT,
  submitter_name TEXT,
  submitter_email TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  article_id TEXT,
  preview_json TEXT,
  scan_json TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export function articleSubmissionsDb() {
  return env.d1_db;
}

export async function ensureArticleSubmissionsTable(db = articleSubmissionsDb()) {
  if (!db) throw new Error("D1 database binding is not configured.");
  await db.prepare(TABLE_SQL).run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_article_submissions_status_created
       ON article_submissions(status, created_at)`,
    )
    .run();
}

export async function createArticleSubmission({
  url,
  title = "",
  summary = "",
  publisher = "",
  submitterName = "",
  submitterEmail = "",
  note = "",
} = {}) {
  const db = articleSubmissionsDb();
  if (!db) throw new Error("D1 database binding is not configured.");

  const articleUrl = normalizeUrl(url);
  if (!articleUrl) throw new Error("A valid article URL is required.");

  await ensureArticleSubmissionsTable(db);

  const preview = await getArticlePreview(articleUrl);
  const finalTitle = cleanText(title || preview?.title || "");
  const finalSummary = cleanText(summary || preview?.description || "");
  const finalPublisher = cleanText(publisher || domainFromUrl(articleUrl));
  const scan = await scanArticleMentions(db, {
    url: articleUrl,
    title: finalTitle,
    summary: finalSummary,
    publisher: finalPublisher,
  });

  await db
    .prepare(
      `INSERT INTO article_submissions (
         url, title, summary, publisher, submitter_name, submitter_email,
         note, preview_json, scan_json
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      articleUrl,
      finalTitle,
      finalSummary,
      finalPublisher,
      cleanText(submitterName),
      cleanText(submitterEmail),
      cleanText(note),
      JSON.stringify(preview || {}),
      JSON.stringify(scan),
    )
    .run();
}

export async function getPendingArticleSubmissions({ limit = 25 } = {}) {
  const db = articleSubmissionsDb();
  if (!db) return [];

  await ensureArticleSubmissionsTable(db);

  const result = await db
    .prepare(
      `SELECT *
       FROM article_submissions
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT ?`,
    )
    .bind(limit)
    .all();

  return (result.results || []).map(normalizeArticleSubmission);
}

export async function moderateArticleSubmission(id, action, reviewer = "") {
  const db = articleSubmissionsDb();
  if (!db) throw new Error("D1 database binding is not configured.");

  await ensureArticleSubmissionsTable(db);

  const submission = normalizeArticleSubmission(
    await db
      .prepare(`SELECT * FROM article_submissions WHERE id = ? LIMIT 1`)
      .bind(Number(id))
      .first(),
  );

  if (!submission.id) throw new Error("Article submission not found.");

  if (action === "reject") {
    await db
      .prepare(
        `UPDATE article_submissions
         SET status = 'rejected', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .bind(reviewer, submission.id)
      .run();
    return;
  }

  if (action !== "approve") {
    throw new Error("Unsupported moderation action.");
  }

  const preview = submission.preview || (await getArticlePreview(submission.url));
  const scan = await scanArticleMentions(db, {
    url: submission.url,
    title: submission.title || preview?.title || "",
    summary: submission.summary || preview?.description || "",
    publisher: submission.publisher,
    note: submission.note,
  });
  const articleId = submission.articleId || articleIdForUrl(submission.url);
  const title = cleanText(submission.title || preview?.title || "Submitted article");
  const summary = cleanText(submission.summary || preview?.description || "");
  const publisher = cleanText(submission.publisher || domainFromUrl(submission.url));

  await db
    .prepare(
      `INSERT INTO d1_articles (
         article_id, title, resource_type, publisher, url, summary, created_at, updated_at
       )
       VALUES (?, ?, 'Community Submitted', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(article_id) DO UPDATE SET
         title = excluded.title,
         resource_type = excluded.resource_type,
         publisher = excluded.publisher,
         url = excluded.url,
         summary = excluded.summary,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(articleId, title, publisher, submission.url, summary)
    .run();

  for (const bill of scan.bills) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO d1_article_bills (
           article_id, sessionyear, condensedbillno, legislationid, bill_label_raw
         )
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(
        articleId,
        bill.sessionyear || null,
        bill.condensedbillno,
        bill.legislationid || null,
        bill.bill_label_raw || bill.condensedbillno,
      )
      .run();
  }

  for (const legislator of scan.legislators) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO d1_article_legislators (
           article_id, personid, employeeno, legislator_name_raw
         )
         VALUES (?, ?, ?, ?)`,
      )
      .bind(
        articleId,
        legislator.personid || null,
        legislator.employeeno || null,
        legislator.name,
      )
      .run();
  }

  for (const candidate of scan.candidates) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO d1_article_candidates (
           article_id, filer_entity_number, candidate_name_raw
         )
         VALUES (?, ?, ?)`,
      )
      .bind(articleId, candidate.filerEntityNumber, candidate.name)
      .run();
  }

  for (const town of scan.towns) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO d1_article_towns (article_id, town)
         VALUES (?, ?)`,
      )
      .bind(articleId, town.town)
      .run();
  }

  await db
    .prepare(
      `UPDATE article_submissions
       SET status = 'approved',
           article_id = ?,
           preview_json = ?,
           scan_json = ?,
           reviewed_by = ?,
           reviewed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .bind(articleId, JSON.stringify(preview || {}), JSON.stringify(scan), reviewer, submission.id)
    .run();
}

export async function scanArticleMentions(db, article = {}) {
  const text = searchableText(article);
  const [bills, legislators, candidates, towns] = await Promise.all([
    scanBills(db, text),
    scanLegislators(db, text),
    scanCandidates(db, text),
    scanTowns(db, text),
  ]);

  return { bills, legislators, candidates, towns };
}

export function normalizeArticleSubmission(submission = {}) {
  const preview = parseJson(submission.preview_json || submission.previewJson);
  const scan = parseJson(submission.scan_json || submission.scanJson) || {};

  return {
    ...submission,
    id: submission.id,
    url: submission.url || "",
    title: cleanText(submission.title || preview?.title || ""),
    summary: cleanText(submission.summary || preview?.description || ""),
    publisher: cleanText(submission.publisher || domainFromUrl(submission.url || "")),
    submitterName: cleanText(submission.submitter_name || submission.submitterName || ""),
    submitterEmail: cleanText(submission.submitter_email || submission.submitterEmail || ""),
    note: cleanText(submission.note || ""),
    status: submission.status || "pending",
    articleId: submission.article_id || submission.articleId || "",
    preview,
    scan: {
      bills: scan.bills || [],
      legislators: scan.legislators || [],
      candidates: scan.candidates || [],
      towns: scan.towns || [],
    },
    createdAt: submission.created_at || submission.createdAt || "",
  };
}

export function articleSubmissionDate(value = "") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return cleanText(value);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function searchableText(article = {}) {
  return normalizeSearchText(
    [
      article.url,
      article.title,
      article.summary,
      article.publisher,
      article.note,
    ].join(" "),
  );
}

async function scanBills(db, text) {
  const matches = [...text.matchAll(/\b(CACR|HB|HJR|HR|SB|SJR|SR)\s*[- ]?\s*(\d+[A-Z]?)\b/g)]
    .map((match) => `${match[1]}${match[2]}`)
    .filter(Boolean);
  const billCodes = [...new Set(matches)].slice(0, 24);
  const bills = [];

  for (const code of billCodes) {
    const result = await db
      .prepare(
        `SELECT sessionyear, condensedbillno, legislationid, expandedbillno, description
         FROM d1_bills
         WHERE UPPER(condensedbillno) = ?
         ORDER BY sessionyear DESC
         LIMIT 1`,
      )
      .bind(code)
      .first();

    bills.push(
      result || {
        condensedbillno: code,
        bill_label_raw: code,
      },
    );
  }

  return bills;
}

async function scanLegislators(db, text) {
  const result = await db
    .prepare(
      `SELECT personid, employeeno, firstname, lastname, legislativebody, district, party
       FROM d1_legislators
       WHERE active = 1
         AND firstname IS NOT NULL
         AND lastname IS NOT NULL`,
    )
    .all();

  return (result.results || [])
    .map((legislator) => ({
      ...legislator,
      name: cleanText(`${legislator.firstname} ${legislator.lastname}`),
    }))
    .filter((legislator) => containsName(text, legislator.name))
    .slice(0, 24);
}

async function scanCandidates(db, text) {
  const result = await db
    .prepare(
      `SELECT filer_entity_number, candidate_first_name, candidate_last_name,
              office, county, district, political_party, slug
       FROM candidates
       WHERE candidate_first_name IS NOT NULL
         AND candidate_last_name IS NOT NULL`,
    )
    .all();

  return (result.results || [])
    .map((candidate) => ({
      ...candidate,
      filerEntityNumber: candidate.filer_entity_number,
      name: cleanText(`${candidate.candidate_first_name} ${candidate.candidate_last_name}`),
    }))
    .filter((candidate) => containsName(text, candidate.name))
    .slice(0, 24);
}

async function scanTowns(db, text) {
  const result = await db
    .prepare(`SELECT DISTINCT communities_represented FROM d1_district_mapping`)
    .all();
  const towns = new Set();

  for (const row of result.results || []) {
    for (const town of townsFromCommunities(row.communities_represented)) {
      if (containsPhrase(text, town)) towns.add(town);
    }
  }

  return [...towns].sort().slice(0, 24).map((town) => ({ town }));
}

function townsFromCommunities(value = "") {
  return String(value || "")
    .split(/[,;]/)
    .map((town) => cleanText(town).replace(/\s*-\s*Ward\s+\d+$/i, "").trim())
    .filter(Boolean);
}

function containsName(text, name) {
  if (!name || name.length < 5) return false;
  return containsPhrase(text, normalizeSearchText(name));
}

function containsPhrase(text, phrase) {
  if (!phrase) return false;
  const escaped = normalizeSearchText(phrase).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^A-Z0-9])${escaped}([^A-Z0-9]|$)`).test(text);
}

function normalizeSearchText(value = "") {
  return cleanText(String(value || ""))
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function normalizeUrl(value = "") {
  try {
    const url = new URL(String(value || "").trim());
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function articleIdForUrl(value = "") {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return `submitted_${hash.toString(16)}`;
}

function domainFromUrl(value = "") {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function parseJson(value = "") {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
