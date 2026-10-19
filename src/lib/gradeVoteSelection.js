export function gradeMotionCategory(vote = {}) {
  const action = voteAction(vote).toLowerCase();
  if (action.includes("reconsider")) return "";

  if (/\botpa\b/.test(action) || action.includes("ought to pass as amended") || action.includes("ought to pass with amendment")) {
    return "OTPA";
  }
  if (/\botp\b/.test(action) || action.includes("ought to pass")) return "OTP";
  if (/\bitl\b/.test(action) || action.includes("inexpedient to legislate")) return "ITL";
  if (/\btable(?:d)?\b/.test(action) || action.includes("laid on the table") || action.includes("lay on the table")) {
    return "Table";
  }
  if (action.includes("interim study")) return "Interim study";
  return "";
}

export function gradeVoteSelectionReason(vote = {}) {
  if (isGradeVoteOverride(vote)) return "Admin-selected vote sequence";
  const category = gradeMotionCategory(vote);
  return category ? `${category} motion` : "Latest eligible motion";
}

export function gradeVoteKey(vote = {}) {
  return [
    vote.sessionyear || vote.session_year || vote.year || "",
    String(vote.legislativebody || vote.legislative_body || vote.body || "").trim().toUpperCase(),
    normalizeBillCode(vote.condensedbillno || vote.bill_number || ""),
    Number(normalizeVoteSequence(
      vote.votesequencenumber || vote.vote_sequence || vote.voteSequence || vote.sequence || 0,
    )),
  ].join("::");
}

export function selectOneGradeVotePerBill(votes = [], { groupByChamber = false } = {}) {
  const grouped = new Map();

  for (const vote of votes) {
    const code = normalizeBillCode(vote.condensedbillno || vote.bill_number || "");
    const sequence = normalizeVoteSequence(
      vote.votesequencenumber || vote.vote_sequence || vote.voteSequence || vote.sequence || "",
    );
    if (!code || !sequence) continue;

    const year = String(vote.sessionyear || vote.session_year || vote.year || "").trim();
    const body = String(vote.legislativebody || vote.legislative_body || vote.body || "").trim().toUpperCase();
    const key = groupByChamber ? `${year}::${body}::${code}` : `${year}::${code}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(vote);
  }

  return [...grouped.values()].map((group) => {
    const overrides = group.filter(isGradeVoteOverride);
    if (overrides.length) return [...overrides].sort(compareGradeVoteRecency)[0];
    const preferred = group.filter((vote) => Boolean(gradeMotionCategory(vote)));
    const candidates = preferred.length ? preferred : group;
    return [...candidates].sort(compareGradeVoteRecency)[0];
  });
}

function isGradeVoteOverride(vote = {}) {
  const value = vote.selected_for_grade_override ?? vote.selectedForGradeOverride;
  return value === true || value === 1 || value === "1" || value === "true";
}

function voteAction(vote = {}) {
  return String(
    vote.action_text ||
      vote.question_motion ||
      vote.motion ||
      vote.title1 ||
      vote.title2 ||
      vote.description ||
      "",
  ).replace(/\s+/g, " ").trim();
}

function normalizeBillCode(value = "") {
  return String(value).toUpperCase().replace(/\s+/g, "");
}

function normalizeVoteSequence(value = "") {
  const sequence = String(value).trim();
  if (/^\d+(\.0+)?$/.test(sequence)) return String(Number.parseInt(sequence, 10));
  return sequence;
}

function compareGradeVoteRecency(first = {}, second = {}) {
  const firstDate = Date.parse(first.vote_date || first.votedate || first.date || "") || 0;
  const secondDate = Date.parse(second.vote_date || second.votedate || second.date || "") || 0;
  if (firstDate !== secondDate) return secondDate - firstDate;

  const firstSequence = Number(normalizeVoteSequence(
    first.votesequencenumber || first.vote_sequence || first.voteSequence || first.sequence || 0,
  ));
  const secondSequence = Number(normalizeVoteSequence(
    second.votesequencenumber || second.vote_sequence || second.voteSequence || second.sequence || 0,
  ));
  return secondSequence - firstSequence;
}
