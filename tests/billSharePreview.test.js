import test from "node:test";
import assert from "node:assert/strict";
import {
  BILL_SHARE_FALLBACK,
  billShareImageUrl,
  billShareStorageKey,
  normalizeBillShareCode,
  validBillShareCode,
  validBillShareYear,
} from "../src/lib/billSharePreview.js";

test("bill share previews use canonical bill, year, and revision values", () => {
  assert.equal(normalizeBillShareCode("sb 101"), "SB101");
  assert.equal(
    billShareImageUrl("sb 101", "2026", "2026-03-12 10:30:00"),
    "https://nhdeservesbetter.com/api/bill-preview/SB101?year=2026&v=v1-2026-03-12-10-30-00",
  );
  assert.equal(
    billShareStorageKey("SB101", 2026, "2026-03-12 10:30:00"),
    "bill-share-previews/2026/SB101/v1-2026-03-12-10-30-00.jpg",
  );
});

test("bill screenshot targets reject unsafe or malformed route parameters", () => {
  for (const bill of ["", "../admin", "SB/101", "SB101?next=evil", "101"]) {
    assert.equal(validBillShareCode(bill), false);
    assert.equal(billShareImageUrl(bill, 2026, "revision"), BILL_SHARE_FALLBACK);
    assert.equal(billShareStorageKey(bill, 2026, "revision"), "");
  }

  for (const year of ["", "1999", "2101", "2026x"]) {
    assert.equal(validBillShareYear(year), "");
  }
});
