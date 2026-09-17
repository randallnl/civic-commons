import assert from "node:assert/strict";
import test from "node:test";
import {
  billSearchQuery,
  mergePeopleSearchResults,
  normalizeSiteSearchQuery,
} from "../src/lib/siteSearch.js";

test("site search normalizes whitespace without changing the search terms", () => {
  assert.equal(normalizeSiteSearchQuery("  Manchester\n  Ward  3  "), "Manchester Ward 3");
});

test("bill search accepts spaced bill numbers and preserves ordinary searches", () => {
  assert.equal(billSearchQuery(" hb  123 "), "HB123");
  assert.equal(billSearchQuery("SB 42A"), "SB42A");
  assert.equal(billSearchQuery("school funding"), "school funding");
});

test("people search combines current legislator and candidate roles by profile", () => {
  const results = mergePeopleSearchResults(
    [{ slug: "jane-doe", name: "Jane Doe", isFreeStateAligned: false, photoUrl: "" }],
    [
      { slug: "jane-doe", name: "Jane Doe", isFreeStateAligned: true, photoUrl: "photo.jpg", candidateOffice: "State Senate" },
      { slug: "john-roe", name: "John Roe", candidateOffice: "State House" },
    ],
    "Jane Doe",
  );

  assert.equal(results.length, 2);
  assert.equal(results[0].slug, "jane-doe");
  assert.equal(results[0].isLegislator, true);
  assert.equal(results[0].isCandidate, true);
  assert.equal(results[0].isFreeStateAligned, true);
  assert.equal(results[0].photoUrl, "photo.jpg");
  assert.equal(results[1].isLegislator, false);
  assert.equal(results[1].isCandidate, true);
});

test("people search ranks exact and prefix name matches before broader matches", () => {
  const results = mergePeopleSearchResults(
    [
      { slug: "anne-smith", name: "Anne Smith" },
      { slug: "smith-jones", name: "Smith Jones" },
      { slug: "smith", name: "Smith" },
    ],
    [],
    "Smith",
  );

  assert.deepEqual(results.map((person) => person.slug), ["smith", "smith-jones", "anne-smith"]);
});
