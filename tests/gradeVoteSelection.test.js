import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  gradeMotionCategory,
  gradeVoteKey,
  gradeVoteSelectionReason,
  selectOneGradeVotePerBill,
} from "../src/lib/gradeVoteSelection.js";

function vote(sequence, motion, overrides = {}) {
  return {
    sessionyear: 2026,
    legislativebody: "H",
    condensedbillno: "HB100",
    votesequencenumber: sequence,
    votedate: `2026-03-${String(sequence).padStart(2, "0")}`,
    question_motion: motion,
    ...overrides,
  };
}

test("selects only the latest preferred disposition vote for each bill and chamber", () => {
  const selected = selectOneGradeVotePerBill([
    vote(1, "Adopt Amendment"),
    vote(2, "Ought to Pass"),
    vote(3, "Reconsideration"),
    vote(4, "Ought to Pass as Amended"),
    vote(5, "Reconsider Ought to Pass as Amended"),
    vote(6, "Special Order"),
  ]);

  assert.equal(selected.length, 1);
  assert.equal(selected[0].votesequencenumber, 4);
  assert.equal(gradeMotionCategory(selected[0]), "OTPA");
  assert.equal(gradeVoteSelectionReason(selected[0]), "OTPA motion");
});

test("falls back to the latest eligible motion when no preferred disposition exists", () => {
  const selected = selectOneGradeVotePerBill([
    vote(7, "Motion A"),
    vote(9, "Motion B"),
    vote(8, "Motion C"),
  ]);

  assert.equal(selected.length, 1);
  assert.equal(selected[0].votesequencenumber, 9);
  assert.equal(gradeVoteSelectionReason(selected[0]), "Latest eligible motion");
});

test("uses one bill vote per person but shows separate chamber selections to admins", () => {
  const votes = [
    vote(10, "Ought to Pass"),
    vote(20, "Inexpedient to Legislate", { legislativebody: "S" }),
    vote(30, "Interim Study", { condensedbillno: "HB200" }),
  ];
  const personSelection = selectOneGradeVotePerBill(votes);
  const adminSelection = selectOneGradeVotePerBill(votes, { groupByChamber: true });

  assert.equal(personSelection.length, 2);
  assert.equal(personSelection.find((item) => item.condensedbillno === "HB100").votesequencenumber, 20);
  assert.equal(adminSelection.length, 3);
  assert.deepEqual(adminSelection.map(gradeVoteKey).sort(), [
    "2026::H::HB100::10",
    "2026::H::HB200::30",
    "2026::S::HB100::20",
  ]);
  assert.equal(gradeMotionCategory(adminSelection[2]), "Interim study");
});

test("grade cache and admin review both use the shared one-vote selector", async () => {
  const [cache, admin, tracked] = await Promise.all([
    readFile(new URL("../src/lib/gradeCache.js", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/admin/votes.astro", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/trackedBills.js", import.meta.url), "utf8"),
  ]);

  assert.match(cache, /selectVotesForAlignmentGrade\(votes\)/);
  assert.match(tracked, /selectOneGradeVotePerBill\(votes\.filter\(isVoteIncludedInGrade\)\)/);
  assert.match(admin, /Selected bill votes/);
  assert.match(admin, /Vote sequence \{vote\.votesequencenumber\}/);
  assert.match(admin, /selected_for_grade/);
});

test("admin vote review exposes allowlisted server-side sorting", async () => {
  const admin = await readFile(
    new URL("../src/pages/admin/votes.astro", import.meta.url),
    "utf8",
  );

  assert.match(admin, /name="sort"/);
  assert.match(admin, /name="direction"/);
  assert.match(admin, /const allowed = new Set\(\["date", "bill", "body", "sequence", "yeas", "nays", "status"\]\)/);
  assert.match(admin, /ORDER BY \$\{orderBy\}/);
});
