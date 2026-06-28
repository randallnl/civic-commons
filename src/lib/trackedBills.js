import { env } from "cloudflare:workers";

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

export function representativeVoteStance(vote = {}, trackedBill = {}) {
  const analysis = representativeVoteAnalysis(vote, trackedBill);

  if (!analysis.voteStance || !analysis.preferredStance) {
    return {
      label: `Voted: ${analysis.interpretation || vote.vote_label || vote.vote || "Not listed"}`,
      className: "legislator-neutral",
    };
  }

  return {
    label: `Voted: ${analysis.interpretation || titleCase(analysis.voteStance)}`,
    className:
      analysis.alignment === "neutral"
        ? "legislator-neutral"
        : analysis.alignment === "aligned"
          ? "legislator-support"
          : "legislator-oppose",
  };
}

export function representativeVoteImpact(vote = {}, trackedBill = {}) {
  return representativeVoteAnalysis(vote, trackedBill).impact;
}

export function representativeGrade(votes = [], trackedBills = new Map()) {
  const scoredVotes = votes
    .map((vote) => {
      const trackedBill = trackedBillForVote(trackedBills, vote);
      if (!trackedBill) return null;
      return representativeVoteAnalysis(vote, trackedBill);
    })
    .filter((analysis) => analysis?.alignment === "aligned" || analysis?.alignment === "misaligned");

  if (!scoredVotes.length) {
    return {
      letter: "N/A",
      percent: null,
      aligned: 0,
      total: 0,
      className: "grade-unknown",
      label: "No scored tracked votes",
    };
  }

  const aligned = scoredVotes.filter((analysis) => analysis.alignment === "aligned").length;
  const percent = aligned / scoredVotes.length;
  const letter =
    percent >= 0.9
      ? "A"
      : percent >= 0.8
        ? "B"
        : percent >= 0.7
          ? "C"
          : percent >= 0.6
            ? "D"
            : "F";

  return {
    letter,
    percent,
    aligned,
    total: scoredVotes.length,
    className: `grade-${letter.toLowerCase()}`,
    label: `${aligned} of ${scoredVotes.length} aligned with the preferred stance`,
  };
}

function representativeVoteAnalysis(vote = {}, trackedBill = {}) {
  const voteStance = normalizeVoteStance(vote);
  const preferredStance = normalizePreferredStance(trackedBill.preferredStance);
  const interpretation =
    voteStance === "yea"
      ? trackedBill.yeaInterpretation
      : voteStance === "nay"
        ? trackedBill.nayInterpretation
        : "";
  const impact =
    voteStance === "yea"
      ? trackedBill.yeaImpact
      : voteStance === "nay"
        ? trackedBill.nayImpact
        : "";

  return {
    voteStance,
    preferredStance,
    interpretation,
    impact,
    alignment:
      !voteStance || !preferredStance || preferredStance === "neutral"
        ? "neutral"
        : voteStance === preferredStance
          ? "aligned"
          : "misaligned",
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
      name: record[columnIndex.name] || "",
      summary: record[columnIndex.summary] || "",
      impact: record[columnIndex.impact] || "",
      moreInfoUrl: record[columnIndex.moreinfourl] || "",
      issueArea: record[columnIndex["issue area"]] || "",
      articles: record[columnIndex.articles] || "",
      yeaInterpretation: record[columnIndex["yea interpretation"]] || "",
      nayInterpretation: record[columnIndex["nay interpretation"]] || "",
      yeaImpact: record[columnIndex["yea impact"]] || "",
      nayImpact: record[columnIndex["nay impact"]] || "",
      voteSequence,
      preferredStance: record[columnIndex["preferred stance"]] || "",
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
  return "";
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
