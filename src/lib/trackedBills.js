import { env } from "cloudflare:workers";
import { cleanText } from "./text";

const DEFAULT_TRACKED_BILLS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHKkGGONM78RXb63Igvi2BXipOA4pV4X5CBY6yHaVAizO-l0q_WtU8uyXI-vhxxbKEib9nFlL1nIBz/pub?gid=1337871563&single=true&output=csv";

let trackedBillsCache = new Map();

export function normalizeBillCode(value = "") {
  return String(value).toUpperCase().replace(/\s+/g, "");
}

export function normalizeVoteSequence(value = "") {
  const sequence = String(value).trim();
  if (/^\d+(\.0+)?$/.test(sequence)) return String(Number.parseInt(sequence, 10));
  return sequence;
}

export function trackedVoteKey(code = "", sequence = "") {
  return `${normalizeBillCode(code)}::${normalizeVoteSequence(sequence)}`;
}

export function billTrackerCsvUrl(csvUrl = "") {
  return (
    csvUrl ||
    env.BILL_TRACKER_TABLE ||
    import.meta.env.BILL_TRACKER_TABLE ||
    import.meta.env.TRACKED_BILLS_CSV_URL ||
    DEFAULT_TRACKED_BILLS_CSV_URL
  );
}

export async function getTrackedBills(csvUrl = "") {
  const resolvedCsvUrl = billTrackerCsvUrl(csvUrl);
  if (trackedBillsCache.has(resolvedCsvUrl)) return trackedBillsCache.get(resolvedCsvUrl);

  const response = await fetch(resolvedCsvUrl);

  if (!response.ok) {
    throw new Error(`Unable to load tracked bills: ${response.status}`);
  }

  const bills = parseTrackedBillsCsv(await response.text());
  trackedBillsCache.set(resolvedCsvUrl, bills);
  return bills;
}

export function trackedBillForVote(bills = new Map(), vote = {}) {
  const code = normalizeBillCode(vote.condensedbillno || vote.bill_number || "");
  const sequence = normalizeVoteSequence(
    vote.votesequencenumber ||
      vote.vote_sequence ||
      vote.voteSequence ||
      vote.sequence ||
      "",
  );

  if (!code) return null;

  if (sequence) {
    const sequenceBill = bills.get(trackedVoteKey(code, sequence));
    if (sequenceBill) return sequenceBill;
  }

  if (hasSequenceSpecificTracker(bills, code)) return null;
  return bills.get(code) || null;
}

export function isVotingAction(vote = {}) {
  const sequence = String(
    vote.votesequencenumber ||
      vote.vote_sequence ||
      vote.voteSequence ||
      vote.sequence ||
      "",
  ).trim();
  const action = cleanText(
    vote.action_text ||
      vote.question_motion ||
      vote.motion ||
      vote.title1 ||
      vote.title2 ||
      vote.description ||
      "",
  ).trim();
  const voteCode = String(vote.vote_code ?? vote.voteCode ?? "").trim();
  const numericVoteCode = Number(voteCode);
  const voteText = String(vote.vote || vote.vote_label || vote.voteLabel || "")
    .trim()
    .toLowerCase();
  const hasVoteCode =
    Number.isInteger(numericVoteCode) && numericVoteCode >= 0 && numericVoteCode <= 7;
  const hasVoteText =
    /\b(yea|yes|nay|no|absent|present|support|against|oppose|not voting|not counted)\b/.test(
      voteText,
    );

  return Boolean(sequence && action && (hasVoteCode || hasVoteText));
}

export function representativeVoteStance(vote = {}, trackedBill = {}) {
  const analysis = representativeVoteAnalysis(vote, trackedBill);

  if (!analysis.voteStance || !analysis.preferredStance) {
    return {
      label: `Voted: ${analysis.interpretation || displayVoteLabel(vote) || "Not listed"}`,
      className: "legislator-neutral",
    };
  }

  return {
    label: `Voted: ${analysis.interpretation || titleCase(analysis.voteStance)}`,
    className:
      analysis.alignment === "neutral" || analysis.alignment === "partial"
        ? "legislator-neutral"
        : analysis.alignment === "aligned"
          ? "legislator-support"
          : "legislator-oppose",
  };
}

export function representativeVoteImpact(vote = {}, trackedBill = {}) {
  return representativeVoteAnalysis(vote, trackedBill).impact;
}

export function gradeFromAlignmentPercent(value) {
  if (value === null || value === undefined || value === "") return null;

  const percentValue = Number(value);
  if (!Number.isFinite(percentValue)) return null;

  const normalizedPercent = percentValue > 1 ? percentValue / 100 : percentValue;
  const letter =
    normalizedPercent >= 0.9
      ? "A"
      : normalizedPercent >= 0.8
        ? "B"
        : normalizedPercent >= 0.7
          ? "C"
          : normalizedPercent >= 0.6
            ? "D"
            : "F";

  return {
    letter,
    percent: normalizedPercent,
    aligned: null,
    total: null,
    className: `grade-${letter.toLowerCase()}`,
    label: `${Math.round(normalizedPercent * 100)}% aligned with the preferred stance`,
  };
}

export function representativeGradeFor(rep = {}, trackedBills = new Map(), billSummaries = new Map()) {
  return (
    representativeGrade(rep.voteHistory || [], trackedBills, billSummaries) ||
    gradeFromAlignmentPercent(rep.alignment_percent || rep.alignmentPercent) ||
    unknownGrade()
  );
}

export function representativeGrade(votes = [], trackedBills = new Map(), billSummaries = new Map()) {
  const scoredVotes = votes
    .map((vote) => {
      if (!isVotingAction(vote)) return null;
      const trackedBill = trackedBillForVote(trackedBills, vote);
      if (!trackedBill) return null;
      const billSummary = billSummaryForVote(billSummaries, vote);
      return representativeVoteAnalysis(vote, {
        ...billSummary,
        ...trackedBill,
      });
    })
    .filter((analysis) => Number.isFinite(analysis?.score));

  if (!scoredVotes.length) {
    return null;
  }

  const aligned = scoredVotes.filter((analysis) => analysis.alignment === "aligned").length;
  const missed = scoredVotes.filter((analysis) => analysis.alignment === "partial").length;
  const percent =
    scoredVotes.reduce((total, analysis) => total + analysis.score, 0) / scoredVotes.length;
  const letter = letterGradeForAccountabilityPercent(percent);
  const missedText = missed ? `, ${missed} missed or not voting` : "";

  return {
    letter,
    percent,
    aligned,
    total: scoredVotes.length,
    className: `grade-${letter.toLowerCase()}`,
    label: `${Math.round(percent * 100)}% accountability score across ${scoredVotes.length} tracked votes (${aligned} aligned${missedText})`,
  };
}

function representativeVoteAnalysis(vote = {}, trackedBill = {}) {
  const voteStance = normalizeVoteStance(vote);
  const preferredStance = preferredStanceForBill(trackedBill);
  const isNonVote = !voteStance && isDocumentedNonVote(vote);
  const interpretation =
    voteStance === "yea"
      ? trackedBill.yeaInterpretation
      : voteStance === "nay"
        ? trackedBill.nayInterpretation
        : displayVoteLabel(vote);
  const impact =
    voteStance === "yea"
      ? trackedBill.yeaImpact
      : voteStance === "nay"
        ? trackedBill.nayImpact
        : "";
  const alignment =
    !preferredStance || preferredStance === "neutral"
      ? "neutral"
      : isNonVote
        ? "partial"
        : !voteStance
          ? "neutral"
          : voteStance === preferredStance
            ? "aligned"
            : "misaligned";
  const score =
    !preferredStance || preferredStance === "neutral"
      ? null
      : isNonVote
        ? 0.6
        : !voteStance
          ? null
          : voteStance === preferredStance
            ? 1
            : 0;

  return {
    voteStance,
    preferredStance,
    interpretation,
    impact,
    alignment,
    score,
  };
}

function parseTrackedBillsCsv(csv) {
  const rows = parseCsv(csv);
  const [headers = [], ...records] = rows;
  const columnIndex = indexHeaders(headers);
  const codeIndex = columnIndex.code;
  const bills = new Map();

  if (codeIndex === undefined) return bills;

  for (const record of records) {
    const code = normalizeBillCode(record[codeIndex]);

    if (!code) continue;

    const voteSequence = normalizeVoteSequence(record[columnIndex["vote sequence"]]);
    const bill = {
      code,
      name: cleanText(record[columnIndex.name] || ""),
      summary: cleanText(record[columnIndex.summary] || ""),
      impact: cleanText(record[columnIndex.impact] || ""),
      moreInfoUrl: record[columnIndex.moreinfourl] || "",
      issueArea: cleanText(record[columnIndex["issue area"]] || ""),
      articles: cleanText(record[columnIndex.articles] || ""),
      yeaInterpretation: cleanText(record[columnIndex["yea interpretation"]] || ""),
      nayInterpretation: cleanText(record[columnIndex["nay interpretation"]] || ""),
      yeaImpact: cleanText(record[columnIndex["yea impact"]] || ""),
      nayImpact: cleanText(record[columnIndex["nay impact"]] || ""),
      voteSequence,
      preferredStance: cleanText(record[columnIndex["preferred stance"]] || ""),
    };

    if (!bills.has(code)) bills.set(code, bill);
    if (voteSequence) bills.set(trackedVoteKey(code, voteSequence), bill);
  }

  return bills;
}

function indexHeaders(headers = []) {
  return Object.fromEntries(
    headers.map((header, index) => [
      String(header).trim().toLowerCase().replace(/\s+/g, " "),
      index,
    ]),
  );
}

function hasSequenceSpecificTracker(bills, code) {
  const prefix = `${normalizeBillCode(code)}::`;

  for (const key of bills.keys()) {
    if (String(key).startsWith(prefix)) return true;
  }

  return false;
}

function normalizeVoteStance(vote = {}) {
  const value = String(vote.vote || vote.vote_label || vote.vote_code || "").trim().toLowerCase();

  if (["1", "yea", "yes", "y", "in support", "support"].includes(value)) return "yea";
  if (["2", "nay", "no", "n", "opposed", "oppose", "against"].includes(value)) return "nay";
  if (value.includes("support")) return "yea";
  if (value.includes("oppose") || value.includes("against")) return "nay";
  return "";
}

function normalizePreferredStance(value = "") {
  const stance = String(value).trim().toLowerCase();

  if (["yea", "yes", "y", "support", "in support"].includes(stance)) return "yea";
  if (["nay", "no", "n", "oppose", "opposed", "against"].includes(stance)) return "nay";
  if (["neutral", "n/a", "na"].includes(stance)) return "neutral";
  if (/\b(yea|yes|support|in support|ought to pass|otp)\b/.test(stance)) return "yea";
  if (/\b(nay|no|oppose|opposed|against|itl|inexpedient)\b/.test(stance)) return "nay";
  return "";
}

function preferredStanceForBill(bill = {}) {
  const documentedStance = normalizePreferredStance(
    bill.preferredStance ||
      bill.preferred_stance ||
      bill.preferredVote ||
      bill.preferred_vote ||
      "",
  );
  if (documentedStance) return documentedStance;

  return publicTestimonyPreferredStance(bill);
}

function publicTestimonyPreferredStance(bill = {}) {
  const support = numericBillValue(bill, [
    "support_count",
    "supportCount",
    "testimonySupport",
    "testimony_support",
    "support",
  ]);
  const oppose = numericBillValue(bill, [
    "oppose_count",
    "opposeCount",
    "testimonyOppose",
    "testimony_oppose",
    "oppose",
    "against",
  ]);
  const total = support + oppose;

  if (!total || support === oppose) return "";

  const margin = Math.abs(support - oppose) / total;
  if (total < 50 && margin <= 0.25) return "neutral";
  if (margin <= 0.1) return "neutral";

  return support > oppose ? "yea" : "nay";
}

function numericBillValue(bill = {}, keys = []) {
  for (const key of keys) {
    const value = Number(bill[key]);
    if (Number.isFinite(value) && value > 0) return value;
  }

  return 0;
}

function billSummaryForVote(billSummaries = new Map(), vote = {}) {
  if (!billSummaries) return null;

  const code = normalizeBillCode(vote.condensedbillno || vote.bill_number || "");
  if (!code) return null;

  if (typeof billSummaries.get === "function") return billSummaries.get(code) || null;
  return billSummaries[code] || billSummaries[code.toLowerCase()] || null;
}

function isDocumentedNonVote(vote = {}) {
  const status = normalizedVoteDisplayValue(vote);
  return [
    "absent",
    "present",
    "other_not_voting",
    "other_present_not_voting",
    "other_not_counted",
    "not voting",
    "present not voting",
    "not counted",
    "excused",
  ].includes(status);
}

function displayVoteLabel(vote = {}) {
  const value = normalizedVoteDisplayValue(vote);
  const labels = {
    absent: "Absent",
    present: "Present",
    other_not_voting: "Not voting",
    other_present_not_voting: "Present not voting",
    other_not_counted: "Not counted",
    unknown: "Unknown",
    "not voting": "Not voting",
    "present not voting": "Present not voting",
    "not counted": "Not counted",
    excused: "Excused",
  };

  if (labels[value]) return labels[value];
  if (!value || ["n/a", "na"].includes(value)) return "";

  return titleCase(value);
}

function normalizedVoteDisplayValue(vote = {}) {
  const values = [
    vote.vote_label,
    vote.voteLabel,
    vote.excuse,
    vote.excuse_label,
    vote.reason,
    vote.not_voting_reason,
    vote.vote,
    vote.vote_code,
  ];

  for (const rawValue of values) {
    const value = String(rawValue ?? "").trim();
    const normalized = value.toLowerCase();
    if (!value || ["n/a", "na", "not listed"].includes(normalized)) continue;
    if (normalized === "3") return "absent";
    if (normalized === "4") return "present";
    if (normalized === "5") return "other_not_voting";
    if (normalized === "6" || normalized === "7") return "other_present_not_voting";
    if (normalized === "0") return "other_not_counted";
    return normalized;
  }

  return "";
}

function letterGradeForAccountabilityPercent(percent) {
  if (percent >= 0.85) return "A";
  if (percent >= 0.7) return "B";
  if (percent >= 0.5) return "C";
  if (percent >= 0.35) return "D";
  return "F";
}

function unknownGrade() {
  return {
    letter: "N/A",
    percent: null,
    aligned: 0,
    total: 0,
    className: "grade-unknown",
    label: "No scored tracked votes",
  };
}

function titleCase(value = "") {
  return String(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const nextChar = csv[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((csvRow) =>
    csvRow.some((value) => String(value).trim().length > 0),
  );
}
