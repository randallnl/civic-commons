import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SESSION_YEAR = 2026;
const SOURCE_BASE = "https://gc.nh.gov/bill_status";
const OUTPUT_DIRECTORY = path.resolve(
  "output/audits/2026-10-18-bill-public-text-refresh",
);

const BILL_CODES = `
HB65 HB392 HB570 HB572 HB191 SB211 HB222 SB33 HB751 HB665 HB360 HB365 HB314 HB155
HB707 HB709 HB396 SB204 SB513 CACR12 SB634 HB1196 HB1811 HB1719 HB1773 HB1831
HB1563 HB1792 HB1570 HB1499 HB1706 CACR10 HB1822 HB1487 HB1708 HB1709 HCR13
HB1484 HB1217 HB1449 HB1299 HB1557 HB1452 HB1573 HB1661 HB1578 HB1219 HB1313
HB1797 HB1337 HB1405 HB1596 HB1735 HB1317 HB1635 HB1636 HB1716 HB1376 HB1642
HB1675 HB1356 HB1799 HB1824 HB1793 HB1704 HB1820 HB1834 HB1580 HB1584
`
  .trim()
  .split(/\s+/);

const BILL_IDS = new Map(Object.entries({
  CACR10: 1732, CACR12: 1308, HB1196: 1506, HB1217: 1918, HB1219: 2110,
  HB1299: 2042, HB1313: 2112, HB1317: 2175, HB1337: 2145, HB1356: 2276,
  HB1376: 2247, HB1405: 2148, HB1449: 1995, HB1452: 2063, HB1484: 1898,
  HB1487: 1823, HB1499: 1652, HB155: 511, HB1557: 2054, HB1563: 1610,
  HB1570: 1651, HB1573: 2078, HB1578: 2104, HB1580: 2435, HB1584: 2450,
  HB1596: 2154, HB1635: 2230, HB1636: 2231, HB1642: 2260, HB1661: 2086,
  HB1675: 2274, HB1704: 2371, HB1706: 1704, HB1708: 1859, HB1709: 1879,
  HB1716: 2240, HB1719: 1573, HB1735: 2174, HB1773: 1592, HB1792: 1642,
  HB1793: 2361, HB1797: 2139, HB1799: 2290, HB1811: 1561, HB1820: 2391,
  HB1822: 1746, HB1824: 2317, HB1831: 1600, HB1834: 2394, HB191: 199,
  HB222: 213, HB314: 496, HB360: 403, HB365: 416, HB392: 64, HB396: 756,
  HB570: 85, HB572: 101, HB65: 51, HB665: 319, HB707: 586, HB709: 630,
  HB751: 275, HCR13: 1890, SB204: 1020, SB211: 202, SB33: 219, SB513: 1297,
  SB634: 1394,
}));

const ENTITY_MAP = new Map([
  ["amp", "&"],
  ["apos", "'"],
  ["gt", ">"],
  ["hellip", "…"],
  ["ldquo", "“"],
  ["lsquo", "‘"],
  ["lt", "<"],
  ["mdash", "—"],
  ["nbsp", " "],
  ["ndash", "–"],
  ["quot", '"'],
  ["rdquo", "”"],
  ["rsquo", "’"],
]);

function decodeHtml(value = "") {
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITY_MAP.get(name.toLowerCase()) ?? match);
}

function plainText(value = "") {
  return decodeHtml(String(value).replace(/<[^>]*>/g, " "))
    .replace(/[\t\r\n ]+/g, " ")
    .trim();
}

function sqlText(value = "") {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function csvCell(value = "") {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function actionDate(value = "") {
  const match = String(value).match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (!match) return "";
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")} 00:00:00`;
}

function publicTitle(officialTitle = "") {
  const cleaned = plainText(officialTitle)
    .replace(/^\(New Title\)\s*/i, "")
    .replace(/^relative to\s+/i, "")
    .replace(/[.\s]+$/, "");

  if (!cleaned) return "";

  const smallWords = new Set([
    "a", "an", "and", "as", "at", "by", "for", "from", "in", "of", "on", "or",
    "the", "to", "with",
  ]);
  const words = cleaned.split(/\s+/);

  return words
    .map((word, index) => {
      const match = word.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u);
      if (!match) return word;
      const [, prefix, core, suffix] = match;
      const lower = core.toLowerCase();
      if (!core || (/^[A-Z0-9-]{2,}$/.test(core) && core !== core.toLowerCase())) return word;
      if (index > 0 && smallWords.has(lower)) return `${prefix}${lower}${suffix}`;
      return `${prefix}${lower.charAt(0).toUpperCase()}${lower.slice(1)}${suffix}`;
    })
    .join(" ");
}

function analysisSummary(html = "") {
  const source = String(html);
  const paragraphs = source.includes("<p")
    ? [...source.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
        .map((match) => plainText(match[1]))
        .filter(Boolean)
    : source
        .split(/\r?\n/)
        .map((line) => plainMarkdown(line))
        .filter(Boolean);
  const analysisIndex = paragraphs.findIndex((paragraph) => /^(?:AMENDED\s+)?ANALYSIS$/i.test(paragraph));
  if (analysisIndex < 0) return "";

  const selected = [];
  for (const paragraph of paragraphs.slice(analysisIndex + 1)) {
    if (/^Explanation:/i.test(paragraph)) break;
    if (/^STATE OF NEW HAMPSHIRE$/i.test(paragraph)) break;
    if (/^[\s—–-]{12,}$/.test(paragraph)) break;
    if (/^This (?:bill|resolution):?$/i.test(paragraph)) continue;
    selected.push(paragraph.replace(/^(?:[IVXLCDM]+|\d+)\.\s+/i, ""));
  }

  return selected.join(" ").replace(/\s+/g, " ").trim();
}

function plainMarkdown(value = "") {
  return decodeHtml(String(value))
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`#]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFromBillText(markdown = "") {
  const source = String(markdown);
  const linkedTitle = source.match(/(?:AN ACT|A RESOLUTION)\s*\[([^\]]+)\]\([^)]+\)/i);
  if (linkedTitle) return plainMarkdown(linkedTitle[1]);

  const constitutionalTitle = source.match(/PROVIDING THAT:\s*\[([^\]]+)\]\([^)]+\)/i);
  if (constitutionalTitle) return plainMarkdown(constitutionalTitle[1]);

  const plainTitle = source.match(/(?:AN ACT|A RESOLUTION)\s+([^\r\n]+)/i);
  return plainMarkdown(plainTitle?.[1] || "");
}

function latestActionFromDocket(markdown = "") {
  const lines = String(markdown)
    .split(/\r?\n/)
    .map(plainMarkdown)
    .filter(Boolean);
  const descriptionIndex = lines.findIndex((line) => /^Description$/i.test(line));
  const docketLines = lines.slice(descriptionIndex >= 0 ? descriptionIndex + 1 : 0);
  const footerIndex = docketLines.findIndex((line) => /HELPFUL LINKS/i.test(line));
  const docketOnly = footerIndex >= 0 ? docketLines.slice(0, footerIndex) : docketLines;
  const actions = docketOnly.filter((line) => !/^(?:Body|Description|H|S)$/i.test(line));
  return actions.at(-1) || "";
}

async function fetchText(url, attempt = 1) {
  let response;
  try {
    response = await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "Mozilla/5.0 (compatible; NHDeservesBetter/1.0; +https://nhdeservesbetter.com)",
      },
    });
  } catch (error) {
    if (attempt < 5) {
      await new Promise((resolve) => setTimeout(resolve, 1_500 * attempt));
      return fetchText(url, attempt + 1);
    }
    throw new Error(`${error?.message || "fetch failed"}: ${url}`);
  }

  if (response.ok) return response.text();
  if (attempt < 5 && (response.status === 403 || response.status === 429 || response.status >= 500)) {
    await new Promise((resolve) => setTimeout(resolve, 1_500 * attempt));
    return fetchText(url, attempt + 1);
  }

  throw new Error(`${response.status} ${response.statusText}: ${url}`);
}

async function fetchBill(code) {
  const detailId = BILL_IDS.get(code);
  if (!detailId) throw new Error(`${code}: official legislation ID not found`);
  const detailUrl = `${SOURCE_BASE}/billinfo.aspx?id=${detailId}&inflect=2`;
  const textUrl = `${SOURCE_BASE}/legacy/bs2016/billText.aspx?sy=${SESSION_YEAR}&id=${detailId}&txtFormat=html`;
  const detailMirrorUrl = `https://r.jina.ai/https://gc.nh.gov/bill_status/billinfo.aspx?id=${detailId}%26inflect=2`;
  const textMirrorUrl = `https://r.jina.ai/https://gc.nh.gov/bill_status/legacy/bs2016/billText.aspx?sy=${SESSION_YEAR}%26id=${detailId}%26txtFormat=html`;
  const [detailMarkdown, textMarkdown] = await Promise.all([
    fetchText(detailMirrorUrl),
    fetchText(textMirrorUrl),
  ]);
  const officialTitle = titleFromBillText(textMarkdown);
  const latestAction = latestActionFromDocket(detailMarkdown);
  const summary = analysisSummary(textMarkdown);

  return {
    code,
    sessionYear: SESSION_YEAR,
    publicTitle: publicTitle(officialTitle),
    publicSummary: summary,
    latestAction,
    officialTitle,
    sourceUrl: detailUrl,
    textUrl,
    needsReview: !officialTitle || !summary || !latestAction,
  };
}

async function mapWithConcurrency(values, limit, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      try {
        results[index] = await mapper(values[index]);
      } catch (error) {
        results[index] = {
          code: values[index],
          sessionYear: SESSION_YEAR,
          publicTitle: "",
          publicSummary: "",
          latestAction: "",
          officialTitle: "",
          sourceUrl: "",
          textUrl: "",
          needsReview: true,
          error: error?.message || String(error),
        };
      }
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

let existingRows = [];
try {
  const existingAudit = JSON.parse(
    await readFile(path.join(OUTPUT_DIRECTORY, "bill-public-text-audit.json"), "utf8"),
  );
  existingRows = Array.isArray(existingAudit.rows) ? existingAudit.rows : [];
} catch {
  existingRows = [];
}

const existingByCode = new Map(existingRows.map((row) => [row.code, row]));
const codesToRefresh = BILL_CODES.filter((code) => {
  const existing = existingByCode.get(code);
  return !existing || existing.needsReview || /Copyright|General Court|HELPFUL LINKS/i.test(existing.latestAction || "");
});
const refreshedRows = await mapWithConcurrency(codesToRefresh, 1, async (code) => {
  const row = await fetchBill(code);
  await new Promise((resolve) => setTimeout(resolve, 350));
  return row;
});
const refreshedByCode = new Map(refreshedRows.map((row) => [row.code, row]));
const rows = BILL_CODES.map((code) => refreshedByCode.get(code) || existingByCode.get(code));
rows.forEach((row) => {
  row.statusDate = actionDate(row.latestAction);
});
const readyRows = rows.filter((row) => !row.needsReview);
const reviewRows = rows.filter((row) => row.needsReview);

await mkdir(OUTPUT_DIRECTORY, { recursive: true });
await writeFile(
  path.join(OUTPUT_DIRECTORY, "bill-public-text-audit.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2)}\n`,
);

const csvHeaders = [
  "bill",
  "session_year",
  "public_title",
  "public_summary",
  "latest_action",
  "status_date",
  "official_title",
  "source_url",
  "text_url",
  "needs_review",
  "error",
];
const csvRows = rows.map((row) => [
  row.code,
  row.sessionYear,
  row.publicTitle,
  row.publicSummary,
  row.latestAction,
  row.statusDate,
  row.officialTitle,
  row.sourceUrl,
  row.textUrl,
  row.needsReview ? "yes" : "no",
  row.error || "",
]);
await writeFile(
  path.join(OUTPUT_DIRECTORY, "bill-public-text-audit.csv"),
  [csvHeaders, ...csvRows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n",
);

const sql = [
  "-- Generated from official New Hampshire General Court records.",
  `-- Generated ${new Date().toISOString()}; ${readyRows.length} complete rows; ${reviewRows.length} flagged rows excluded.`,
  ...readyRows.map((row) => `INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  ${row.sessionYear},
  ${sqlText(row.code)},
  ${sqlText(row.publicTitle)},
  ${sqlText(row.publicSummary)},
  ${sqlText(row.latestAction)},
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = ${sqlText(row.latestAction)}${row.statusDate ? `,
  statusdate = ${sqlText(row.statusDate)}` : ""}
WHERE sessionyear = ${row.sessionYear}
  AND UPPER(condensedbillno) = ${sqlText(row.code)};`),
  "",
].join("\n");
await writeFile(path.join(OUTPUT_DIRECTORY, "bill-public-text-updates.sql"), sql);

console.log(JSON.stringify({
  outputDirectory: OUTPUT_DIRECTORY,
  requested: rows.length,
  ready: readyRows.length,
  needsReview: reviewRows.map((row) => ({ code: row.code, error: row.error || "Missing required source field" })),
}, null, 2));
