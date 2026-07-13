import { env } from "cloudflare:workers";
import { getArticlePreview } from "./articlePreviews";
import { cleanText } from "./text";
import {
  linkArticlePersonByPersonId,
  linkArticlePersonByCandidate,
  linkArticlePersonByLegislator,
} from "./unifiedPeople";

const FIRST_NAME_ALIASES = {
  anthony: ["tony"],
  benjamin: ["ben"],
  christopher: ["chris"],
  daniel: ["dan"],
  david: ["dave"],
  deborah: ["deb", "debbie"],
  elizabeth: ["beth", "liz"],
  james: ["jim"],
  john: ["jack"],
  joseph: ["joe"],
  kenneth: ["ken"],
  michael: ["mike"],
  patrick: ["pat"],
  robert: ["bob"],
  thomas: ["tom"],
  timothy: ["tim"],
  william: ["bill"],
};

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
  const bodyText = await getArticleBodyText(articleUrl);
  const previewWithBody = { ...(preview || {}), bodyText };
  const finalTitle = cleanText(title || preview?.title || "");
  const finalSummary = cleanText(summary || preview?.description || "");
  const finalPublisher = cleanText(publisher || domainFromUrl(articleUrl));
  const scan = await scanArticleMentions(db, {
    url: articleUrl,
    title: finalTitle,
    summary: finalSummary,
    publisher: finalPublisher,
    bodyText,
    note,
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
      JSON.stringify(previewWithBody),
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

  const submissions = [];

  for (const row of result.results || []) {
    submissions.push(await hydratePendingSubmissionScan(db, row));
  }

  return submissions.map(normalizeArticleSubmission);
}

async function hydratePendingSubmissionScan(db, row = {}) {
  const submission = normalizeArticleSubmission(row);
  const hasBodyText = Boolean(submission.preview?.bodyText);

  if (hasBodyText || !submission.url) return row;

  const bodyText = await getArticleBodyText(submission.url);
  if (!bodyText) return row;

  const previewWithBody = { ...(submission.preview || {}), bodyText };
  const rescan = await scanArticleMentions(db, {
    url: submission.url,
    title: submission.title,
    summary: submission.summary,
    publisher: submission.publisher,
    note: submission.note,
    bodyText,
  });
  const scan = mergeArticleScans(submission.scan, rescan);

  await db
    .prepare(
      `UPDATE article_submissions
       SET preview_json = ?, scan_json = ?
       WHERE id = ? AND status = 'pending'`,
    )
    .bind(JSON.stringify(previewWithBody), JSON.stringify(scan), submission.id)
    .run();

  return {
    ...row,
    preview_json: JSON.stringify(previewWithBody),
    scan_json: JSON.stringify(scan),
  };
}

export async function moderateArticleSubmission(id, action, reviewer = "", manualLinks = {}) {
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
  const bodyText = preview?.bodyText || (await getArticleBodyText(submission.url));
  const previewWithBody = { ...(preview || {}), bodyText };
  const detectedScan = await scanArticleMentions(db, {
    url: submission.url,
    title: submission.title || preview?.title || "",
    summary: submission.summary || preview?.description || "",
    publisher: submission.publisher,
    note: submission.note,
    bodyText,
  });
  const manualScan = await resolveManualArticleLinks(db, manualLinks);
  const scan = mergeArticleScans(detectedScan, manualScan);
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

  await insertArticleRelations(db, articleId, scan);

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
    .bind(articleId, JSON.stringify(previewWithBody), JSON.stringify(scan), reviewer, submission.id)
    .run();
}

export async function addManualArticleLinks(articleId, manualLinks = {}) {
  const db = articleSubmissionsDb();
  if (!db) throw new Error("D1 database binding is not configured.");
  if (!articleId) throw new Error("Article ID is required.");

  const article = await db
    .prepare(`SELECT article_id FROM d1_articles WHERE article_id = ? LIMIT 1`)
    .bind(articleId)
    .first();

  if (!article) throw new Error("Article not found.");

  const scan = await resolveManualArticleLinks(db, manualLinks);
  await insertArticleRelations(db, articleId, scan);
  return scan;
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
      people: scan.people || [],
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
      article.bodyText,
    ].join(" "),
  );
}

async function getArticleBodyText(articleUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7_000);

  try {
    const response = await fetch(articleUrl, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent":
          "Mozilla/5.0 (compatible; NHDeservesBetterBot/1.0; +https://nhdeservesbetter.com/articles)",
      },
      signal: controller.signal,
    });

    if (!response.ok) return "";

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return "";
    }

    const html = await response.text();
    return extractReadableText(html);
  } catch (error) {
    console.warn(`Unable to fetch article body: ${articleUrl}`, error?.message || error);
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

function extractReadableText(html = "") {
  const cleaned = String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  const articleLike =
    cleaned.match(/<article[\s\S]*?<\/article>/i)?.[0] ||
    cleaned.match(/<main[\s\S]*?<\/main>/i)?.[0] ||
    cleaned;

  return cleanText(
    decodeHtmlEntities(
      articleLike
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<\/(p|div|h[1-6]|li|blockquote|section|article)>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    ),
  ).slice(0, 120_000);
}

function decodeHtmlEntities(value = "") {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ldquo;|&rdquo;/gi, '"')
    .replace(/&lsquo;|&rsquo;/gi, "'")
    .replace(/&mdash;/gi, "-")
    .replace(/&ndash;/gi, "-")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
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

async function resolveManualArticleLinks(db, manualLinks = {}) {
  const [bills, legislators, candidates, people] = await Promise.all([
    resolveManualBills(db, manualLinks.bills || manualLinks.billLinks || ""),
    resolveManualLegislators(db, manualLinks.legislators || manualLinks.legislatorLinks || ""),
    resolveManualCandidates(db, manualLinks.candidates || manualLinks.candidateLinks || ""),
    resolveManualPeople(db, manualLinks.people || manualLinks.personLinks || ""),
  ]);

  return {
    bills,
    legislators: dedupeBy(
      [
        ...legislators,
        ...people
          .filter((person) => person.personid || person.employeeno)
          .map(personToLegislatorLink),
      ],
      (legislator) => legislator.personid || legislator.employeeno || legislator.name,
    ),
    candidates: dedupeBy(
      [
        ...candidates,
        ...people
          .filter((person) => person.filerEntityNumber || person.filer_entity_number)
          .map(personToCandidateLink),
      ],
      (candidate) => candidate.filerEntityNumber || candidate.filer_entity_number || candidate.name,
    ),
    people,
    towns: [],
  };
}

async function insertArticleRelations(db, articleId, scan = {}) {
  for (const bill of scan.bills || []) {
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

  for (const legislator of scan.legislators || []) {
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
        legislator.name || legislator.legislator_name_raw,
      )
      .run();
    await linkArticlePersonByLegislator(articleId, legislator, db);
  }

  for (const candidate of scan.candidates || []) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO d1_article_candidates (
           article_id, filer_entity_number, candidate_name_raw
         )
         VALUES (?, ?, ?)`,
      )
      .bind(
        articleId,
        candidate.filerEntityNumber || candidate.filer_entity_number,
        candidate.name || candidate.candidate_name_raw,
      )
      .run();
    await linkArticlePersonByCandidate(articleId, candidate, db);
  }

  for (const person of scan.people || []) {
    await linkArticlePersonByPersonId(articleId, person.personId || person.id, person.name || person.display_name, db);
  }

  for (const town of scan.towns || []) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO d1_article_towns (article_id, town)
         VALUES (?, ?)`,
      )
      .bind(articleId, town.town)
      .run();
  }
}

async function resolveManualBills(db, value = "") {
  const codes = splitManualValues(value)
    .map((code) => code.toUpperCase().replace(/\s+/g, ""))
    .filter(Boolean);
  const bills = [];

  for (const code of codes) {
    const bill = await db
      .prepare(
        `SELECT sessionyear, condensedbillno, legislationid, expandedbillno, description
         FROM d1_bills
         WHERE UPPER(condensedbillno) = ?
         ORDER BY sessionyear DESC
         LIMIT 1`,
      )
      .bind(code)
      .first();

    bills.push(bill || { condensedbillno: code, bill_label_raw: code });
  }

  return dedupeBy(bills, (bill) => bill.condensedbillno);
}

async function resolveManualLegislators(db, value = "") {
  const terms = splitManualValues(value);
  const legislators = [];

  for (const term of terms) {
    const numeric = /^\d+$/.test(term) ? Number(term) : null;
    const slug = slugify(term);
    const legislator = numeric
      ? await db
          .prepare(
            `SELECT personid, employeeno, firstname, lastname, legislativebody, district, party
             FROM d1_legislators
             WHERE personid = ? OR employeeno = ?
             LIMIT 1`,
          )
          .bind(numeric, numeric)
          .first()
      : await db
          .prepare(
            `SELECT personid, employeeno, firstname, lastname, legislativebody, district, party
             FROM d1_legislators
             WHERE LOWER(firstname || ' ' || lastname) = LOWER(?)
                OR LOWER(COALESCE(slug, '')) = LOWER(?)
             LIMIT 1`,
          )
          .bind(term, slug)
          .first();

    if (legislator) {
      legislators.push({
        ...legislator,
        name: cleanText(`${legislator.firstname} ${legislator.lastname}`),
      });
    }
  }

  return dedupeBy(legislators, (legislator) => legislator.personid || legislator.employeeno || legislator.name);
}

async function resolveManualCandidates(db, value = "") {
  const terms = splitManualValues(value);
  const candidates = [];

  for (const term of terms) {
    const slug = slugify(term);
    const candidate = await db
      .prepare(
        `SELECT filer_entity_number, candidate_first_name, candidate_last_name,
                office, county, district, political_party, slug
         FROM candidates
         WHERE filer_entity_number = ?
            OR LOWER(COALESCE(slug, '')) = LOWER(?)
            OR LOWER(candidate_first_name || ' ' || candidate_last_name) = LOWER(?)
         LIMIT 1`,
      )
      .bind(term, slug, term)
      .first();

    if (candidate) {
      candidates.push({
        ...candidate,
        filerEntityNumber: candidate.filer_entity_number,
        name: cleanText(`${candidate.candidate_first_name} ${candidate.candidate_last_name}`),
      });
    }
  }

  return dedupeBy(candidates, (candidate) => candidate.filerEntityNumber || candidate.filer_entity_number);
}

async function resolveManualPeople(db, value = "") {
  const terms = splitManualValues(value);
  const people = [];

  for (const term of terms) {
    const numeric = /^\d+$/.test(term) ? Number(term) : null;
    const slug = slugify(term);
    const person = numeric
      ? await db
          .prepare(
            `SELECT id, gc_personid, employeeno, filer_entity_number, firstname, lastname,
                    display_name, party, is_current_legislator, is_2026_candidate
             FROM d1_people
             WHERE id = ?
                OR gc_personid = ?
                OR employeeno = ?
                OR filer_entity_number = ?
             LIMIT 1`,
          )
          .bind(numeric, numeric, numeric, term)
          .first()
      : await db
          .prepare(
            `SELECT id, gc_personid, employeeno, filer_entity_number, firstname, lastname,
                    display_name, party, is_current_legislator, is_2026_candidate
             FROM d1_people
             WHERE LOWER(COALESCE(slug, '')) = LOWER(?)
                OR LOWER(display_name) = LOWER(?)
                OR LOWER(firstname || ' ' || lastname) = LOWER(?)
                OR filer_entity_number = ?
             LIMIT 1`,
          )
          .bind(slug, term, term, term)
          .first();

    if (person) {
      people.push(normalizeManualPerson(person));
    }
  }

  return dedupeBy(people, (person) => person.personId);
}

function normalizeManualPerson(person = {}) {
  const name = cleanText(person.display_name || `${person.firstname || ""} ${person.lastname || ""}`);
  return {
    ...person,
    id: person.id,
    personId: person.id,
    personid: person.gc_personid || null,
    employeeno: person.employeeno || null,
    filerEntityNumber: person.filer_entity_number || "",
    name,
    legislator_name_raw: name,
    candidate_name_raw: name,
    candidate_first_name: person.firstname || "",
    candidate_last_name: person.lastname || "",
    isCurrentLegislator: Number(person.is_current_legislator) === 1,
    is2026Candidate: Number(person.is_2026_candidate) === 1,
  };
}

function personToLegislatorLink(person = {}) {
  return {
    personid: person.personid || person.gc_personid || null,
    employeeno: person.employeeno || null,
    firstname: person.firstname || "",
    lastname: person.lastname || "",
    party: person.party || "",
    name: person.name || person.display_name || "",
    legislator_name_raw: person.legislator_name_raw || person.name || person.display_name || "",
  };
}

function personToCandidateLink(person = {}) {
  return {
    filer_entity_number: person.filerEntityNumber || person.filer_entity_number || "",
    filerEntityNumber: person.filerEntityNumber || person.filer_entity_number || "",
    candidate_first_name: person.firstname || person.candidate_first_name || "",
    candidate_last_name: person.lastname || person.candidate_last_name || "",
    political_party: person.party || "",
    name: person.name || person.display_name || "",
    candidate_name_raw: person.candidate_name_raw || person.name || person.display_name || "",
  };
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
    .filter((legislator) => containsPersonName(text, legislator.firstname, legislator.lastname))
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
    .filter((candidate) =>
      containsPersonName(text, candidate.candidate_first_name, candidate.candidate_last_name),
    )
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

function containsPersonName(text, firstName = "", lastName = "") {
  const normalizedFirst = cleanText(firstName).trim();
  const normalizedLast = cleanText(lastName).trim();
  if (!normalizedFirst || !normalizedLast) return false;

  const variants = [
    `${normalizedFirst} ${normalizedLast}`,
    ...firstNameAliases(normalizedFirst).map((alias) => `${alias} ${normalizedLast}`),
  ];

  return variants.some((name) => containsName(text, name));
}

function firstNameAliases(firstName = "") {
  const firstPart = String(firstName).trim().split(/\s+/)[0]?.toLowerCase() || "";
  return FIRST_NAME_ALIASES[firstPart] || [];
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

function mergeArticleScans(...scans) {
  return {
    bills: dedupeBy(scans.flatMap((scan) => scan?.bills || []), (bill) => bill.condensedbillno),
    legislators: dedupeBy(
      scans.flatMap((scan) => scan?.legislators || []),
      (legislator) => legislator.personid || legislator.employeeno || legislator.name,
    ),
    candidates: dedupeBy(
      scans.flatMap((scan) => scan?.candidates || []),
      (candidate) => candidate.filerEntityNumber || candidate.filer_entity_number || candidate.name,
    ),
    people: dedupeBy(
      scans.flatMap((scan) => scan?.people || []),
      (person) => person.personId || person.id || person.name,
    ),
    towns: dedupeBy(scans.flatMap((scan) => scan?.towns || []), (town) => town.town),
  };
}

function splitManualValues(value = "") {
  return String(value || "")
    .split(/[\n,;]/)
    .map((item) => cleanText(item).trim())
    .filter(Boolean)
    .slice(0, 30);
}

function dedupeBy(values = [], keyFor) {
  const seen = new Set();
  const unique = [];

  for (const value of values || []) {
    const key = String(keyFor(value) || "").toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(value);
  }

  return unique;
}

function slugify(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
