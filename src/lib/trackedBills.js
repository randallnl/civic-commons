import { env } from "cloudflare:workers";
import { cleanText } from "./text";
import { effectiveVoteVisibility, isProceduralAlignmentMotion } from "./voteVisibility";

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
  if (!effectiveVoteVisibility(vote).includeInDisplay) return false;
  if (isExcludedAlignmentMotion(action) && vote.include_in_display === undefined) return false;
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

export function isExcludedAlignmentMotion(value = "") {
  return isProceduralAlignmentMotion(value);
}

export function isVoteIncludedInGrade(vote = {}) {
  return Boolean(effectiveVoteVisibility(vote).includeInGrades);
}

export function isKnownVote(vote = {}) {
  const value = normalizedVoteDisplayValue(vote);
  return Boolean(value && !["unknown", "not listed"].includes(value));
}

export function representativeVoteAttendance(votes = []) {
  const votingActions = votes.filter(isVotingAction);
  const recorded = votingActions.filter((vote) => normalizeVoteStance(vote)).length;
  const documentedNonVotes = votingActions.filter((vote) => !normalizeVoteStance(vote) && isDocumentedNonVote(vote));
  const notVoting = documentedNonVotes.length;
  const unknown = Math.max(0, votingActions.length - recorded - notVoting);
  const accountableTotal = recorded + notVoting;
  const percent = accountableTotal ? recorded / accountableTotal : null;

  return {
    recorded,
    notVoting,
    unknown,
    total: votingActions.length,
    accountableTotal,
    percent,
    label: percent === null
      ? "No voting actions returned yet"
      : `${Math.round(percent * 100)}% vote attendance across ${accountableTotal} documented voting actions`,
  };
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

export function gradeFromCachedOnlineTestimony(rep = {}) {
  const percentValue =
    rep.online_testimony_alignment_pct ??
    rep.onlineTestimonyAlignmentPct ??
    rep.cached_alignment_percent ??
    rep.cachedAlignmentPercent;
  const grade = String(
    rep.online_testimony_grade ||
      rep.onlineTestimonyGrade ||
      rep.cached_grade ||
      rep.cachedGrade ||
      "",
  ).trim().toUpperCase();
  const percentNumber = Number(percentValue);
  const percent = percentNumber > 1 ? percentNumber / 100 : percentNumber;

  if (!grade || !Number.isFinite(percent)) return null;

  const total = numberOrNull(rep.online_testimony_scored_votes ?? rep.onlineTestimonyScoredVotes);
  const aligned = numberOrNull(rep.online_testimony_aligned_votes ?? rep.onlineTestimonyAlignedVotes);
  const partial = numberOrNull(rep.online_testimony_partial_votes ?? rep.onlineTestimonyPartialVotes);
  const misaligned = numberOrNull(rep.online_testimony_misaligned_votes ?? rep.onlineTestimonyMisalignedVotes);
  const partialText = partial ? `, ${partial} missed or not voting` : "";
  const voteText = total
    ? `Based on ${total} scored vote${total === 1 ? "" : "s"}${aligned === null ? "." : `; ${aligned} aligned with online testimony${partialText}.`}`
    : "Based on available scored votes.";

  return {
    letter: grade,
    percent,
    aligned,
    misaligned,
    partial,
    total,
    className: `grade-${grade.toLowerCase()}`,
    label: voteText,
    updatedAt: rep.grade_updated_at || rep.gradeUpdatedAt || "",
  };
}

export function representativeGradeFor(rep = {}, trackedBills = new Map(), billSummaries = new Map()) {
  return (
    gradeFromCachedOnlineTestimony(rep) ||
    representativeOnlineTestimonyGrade(rep.voteHistory || [], billSummaries) ||
    gradeFromAlignmentPercent(
      rep.alignment_percent ??
        rep.alignmentPercent ??
        rep.preferred_vote_alignment_pct ??
        rep.preferredVoteAlignmentPct,
    ) ||
    unknownGrade()
  );
}

export function testimonyAlignmentPercentForGrade(grade = {}) {
  const aligned = Number(grade?.aligned);
  const total = Number(grade?.total);

  if (Number.isFinite(aligned) && Number.isFinite(total) && total > 0) {
    return Math.round((aligned / total) * 100);
  }

  const fallbackValue = grade?.percent;
  if (fallbackValue === null || fallbackValue === undefined || fallbackValue === "") return null;

  const fallback = Number(fallbackValue);
  if (!Number.isFinite(fallback)) return null;

  const normalized = fallback > 1 ? fallback / 100 : fallback;
  return Math.round(Math.max(0, Math.min(1, normalized)) * 100);
}

export function representativeOnlineTestimonyGrade(votes = [], billSummaries = new Map()) {
  const scoredVotes = votes
    .filter((vote) => isVotingAction(vote) && isKnownVote(vote) && isVoteIncludedInGrade(vote))
    .map((vote) => representativeOnlineTestimonyAnalysis(vote, billSummaryForVote(billSummaries, vote)))
    .filter((analysis) => Number.isFinite(analysis?.score));

  if (!scoredVotes.length) return null;

  const aligned = scoredVotes.filter((analysis) => analysis.alignment === "aligned").length;
  const missed = scoredVotes.filter((analysis) => analysis.alignment === "partial").length;
  const totalWeight = scoredVotes.reduce((total, analysis) => total + analysis.testimonyWeight, 0);
  const netScore = scoredVotes.reduce((total, analysis) => total + analysis.score, 0);
  const percent = totalWeight ? netScore / totalWeight : null;
  if (!Number.isFinite(percent)) return null;
  const letter = letterGradeForAccountabilityPercent(percent);
  const missedText = missed ? `, ${missed} missed or not voting` : "";

  return {
    letter,
    percent,
    aligned,
    total: scoredVotes.length,
    totalWeight,
    netScore,
    className: `grade-${letter.toLowerCase()}`,
    label: `Based on ${scoredVotes.length} scored vote${scoredVotes.length === 1 ? "" : "s"}; ${aligned} aligned with online testimony${missedText}.`,
  };
}

export function representativeGrade(votes = [], trackedBills = new Map(), billSummaries = new Map()) {
  const scoredVotes = votes
    .map((vote) => {
      if (!isVotingAction(vote) || !isVoteIncludedInGrade(vote)) return null;
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

export function representativeOnlineTestimonyVotePreviews(
  rep = {},
  billSummaries = new Map(),
  { limit = 3 } = {},
) {
  const nameKey = rep.name || `${rep.firstname || ""} ${rep.lastname || ""}`.trim();
  return (rep.voteHistory || [])
    .map((vote) => {
      if (!isVotingAction(vote) || !isKnownVote(vote) || !isVoteIncludedInGrade(vote)) return null;
      const billSummary = billSummaryForVote(billSummaries, vote);
      const analysis = representativeOnlineTestimonyAnalysis(vote, billSummary);
      if (!Number.isFinite(analysis.score) || !billSummary) return null;
      return {
        vote,
        billSummary,
        analysis,
        sortKey: stablePreviewSortKey(`${nameKey}:${vote.condensedbillno || vote.bill_number}:${vote.votesequencenumber || vote.vote_sequence || ""}`),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(0, limit);
}

export function representativeOnlineTestimonyVoteStance(vote = {}, bill = {}) {
  const analysis = representativeOnlineTestimonyAnalysis(vote, bill);
  const rawVote = displayVoteLabel(vote) || titleCase(String(vote.vote || vote.vote_code || ""));

  if (analysis.alignment === "partial" && analysis.testimonyPosition) {
    return {
      label: `Voted: ${rawVote}: documented nonvote - accountability penalty`,
      className: "legislator-neutral",
    };
  }

  if (!analysis.billPosition || !analysis.testimonyPosition) {
    return {
      label: `Voted: ${rawVote || "Not listed"}: no clear online testimony position`,
      className: "legislator-neutral",
    };
  }

  const position = titleCase(analysis.billPosition);
  const suffix =
    analysis.alignment === "aligned"
      ? "aligned with online testimony"
      : analysis.alignment === "partial"
        ? "documented non-vote"
        : "not aligned with online testimony";

  return {
    label: `Voted: ${rawVote}: ${position} - ${suffix}`,
    className:
      analysis.alignment === "aligned"
        ? "legislator-support"
        : analysis.alignment === "misaligned"
          ? "legislator-oppose"
          : "legislator-neutral",
  };
}

export function representativeOnlineTestimonyAnalysis(vote = {}, bill = {}) {
  const testimonyPosition = publicTestimonyPositionForBill(bill);
  const testimonyStrength = publicTestimonyStrengthForBill(bill);
  const testimonyWeight = testimonyStrength.weight;
  const billPosition = inferredBillPositionForVote(vote);
  const isNonVote = !billPosition && isDocumentedNonVote(vote);
  const alignment =
    !testimonyPosition || testimonyPosition === "neutral"
      ? "neutral"
      : isNonVote
        ? "partial"
        : !billPosition
          ? "neutral"
          : billPosition === testimonyPosition
            ? "aligned"
            : "misaligned";
  const alignmentValue =
    !testimonyPosition || testimonyPosition === "neutral"
      ? null
      : isNonVote
        ? -0.3
        : !billPosition
          ? null
          : billPosition === testimonyPosition
            ? 1
            : -1;
  const score =
    !testimonyPosition || testimonyPosition === "neutral" || !testimonyWeight
      ? null
      : isNonVote
        ? -0.3 * testimonyWeight
        : !billPosition
          ? null
          : billPosition === testimonyPosition
            ? testimonyWeight
            : -testimonyWeight;

  return {
    billPosition,
    testimonyPosition,
    testimonyStrength: testimonyStrength.label,
    testimonyWeight,
    alignment,
    alignmentValue,
    score,
  };
}

function representativeVoteAnalysis(vote = {}, trackedBill = {}) {
  const bill = trackedBill || {};
  const voteStance = normalizeVoteStance(vote);
  const preferredStance = preferredStanceForBill(bill);
  const isNonVote = !voteStance && isDocumentedNonVote(vote);
  const interpretation =
    voteStance === "yea"
      ? bill.yeaInterpretation
      : voteStance === "nay"
        ? bill.nayInterpretation
        : displayVoteLabel(vote);
  const impact =
    voteStance === "yea"
      ? bill.yeaImpact
      : voteStance === "nay"
        ? bill.nayImpact
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
        ? -0.3
        : !voteStance
          ? null
          : voteStance === preferredStance
            ? 1
            : -1;

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
  const position = publicTestimonyPositionForBill(bill);
  if (position === "support") return "yea";
  if (position === "oppose") return "nay";
  if (position === "neutral") return "neutral";
  return "";
}

export function publicTestimonyPositionForBill(bill = {}) {
  return publicTestimonyStrengthForBill(bill).position;
}

export function publicTestimonyStrengthForBill(bill = {}) {
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

  if (!total || support === oppose) {
    return { position: "", label: total ? "Neutral" : "No testimony", weight: 0, support, oppose, total };
  }

  const margin = Math.abs(support - oppose) / total;

  // Divided online testimony should not move a legislator's alignment score.
  if (total < 50 && margin <= 0.25) {
    return { position: "neutral", label: "Neutral", weight: 0, support, oppose, total, margin };
  }
  if (margin <= 0.1) {
    return { position: "neutral", label: "Divided", weight: 0, support, oppose, total, margin };
  }

  const position = support > oppose ? "support" : "oppose";
  const direction = position === "support" ? "Support" : "Oppose";
  const weight = margin >= 0.5 ? 1 : margin >= 0.25 ? 0.7 : 0.35;
  const intensity = margin >= 0.5 ? "Overwhelmingly" : margin >= 0.25 ? "Mostly" : "Slightly";

  return {
    position,
    label: `${intensity} ${direction}`,
    weight,
    support,
    oppose,
    total,
    margin,
  };
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

export function inferredBillPositionForVote(vote = {}) {
  const voteStance = normalizeVoteStance(vote);
  if (!voteStance) return "";

  const motionText = cleanText(
    vote.action_text ||
      vote.question_motion ||
      vote.motion ||
      vote.title1 ||
      vote.title2 ||
      vote.description ||
      "",
  ).toLowerCase();
  const motionOpposesBill =
    /\bitl\b/.test(motionText) ||
    motionText.includes("inexpedient to legislate") ||
    /\btable\b/.test(motionText) ||
    motionText.includes("laid on the table") ||
    motionText.includes("lay on the table") ||
    motionText.includes("indefinitely postpone") ||
    motionText.includes("postpone indefinitely");

  if (motionOpposesBill) return voteStance === "yea" ? "oppose" : "support";
  return voteStance === "yea" ? "support" : "oppose";
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
  if (percent >= 0.55) return "A";
  if (percent >= 0.25) return "B";
  if (percent >= -0.42) return "C";
  if (percent >= -0.6) return "D";
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

function stablePreviewSortKey(value = "") {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
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
