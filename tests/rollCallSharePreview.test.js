import test from "node:test";
import assert from "node:assert/strict";
import {
  ROLL_CALL_SHARE_FALLBACK,
  normalizeRollCallBillCode,
  rollCallShareImageUrl,
  rollCallShareStorageKey,
  validRollCallBillCode,
  validRollCallSequence,
  validRollCallYear,
} from "../src/lib/rollCallSharePreview.js";

test("roll call share previews use canonical bill, sequence, year, and revision values", () => {
  assert.equal(normalizeRollCallBillCode("hb 1132"), "HB1132");
  assert.equal(
    rollCallShareImageUrl("hb 1132", "154", "2026", "2026-03-12 10:30:00"),
    "https://nhdeservesbetter.com/api/roll-call-preview/HB1132/154?year=2026&v=2026-03-12-10-30-00",
  );
  assert.equal(
    rollCallShareStorageKey("HB1132", 154, 2026, "2026-03-12 10:30:00"),
    "roll-call-share-previews/2026/HB1132/154/2026-03-12-10-30-00.jpg",
  );
});

test("roll call screenshot targets reject unsafe or malformed route parameters", () => {
  for (const bill of ["", "../admin", "HB/1132", "HB1132?next=evil", "1132"]) {
    assert.equal(validRollCallBillCode(bill), false);
    assert.equal(rollCallShareImageUrl(bill, 154, 2026, "revision"), ROLL_CALL_SHARE_FALLBACK);
    assert.equal(rollCallShareStorageKey(bill, 154, 2026, "revision"), "");
  }

  for (const sequence of ["", "0", "-1", "1.5", "154x", 1_000_000]) {
    assert.equal(validRollCallSequence(sequence), "");
  }

  for (const year of ["", "1999", "2101", "2026x"]) {
    assert.equal(validRollCallYear(year), "");
  }
});
