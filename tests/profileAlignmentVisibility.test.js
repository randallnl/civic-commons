import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { parseRepresentative } from "../src/lib/schemas.js";

test("representative data preserves the alignment rating visibility flag", () => {
  const representative = parseRepresentative({
    name: "Example Legislator",
    show_alignment_rating: 0,
  });

  assert.equal(representative.show_alignment_rating, 0);
});

test("people profile admin can hide the saved alignment rating without deleting it", async () => {
  const [profile, votes, endpoint, people, gradeCache] = await Promise.all([
    readFile(new URL("../src/pages/people/[slug].astro", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/people/[slug]/votes.astro", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/api/admin/profile.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/unifiedPeople.js", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/gradeCache.js", import.meta.url), "utf8"),
  ]);

  assert.match(profile, /name="showAlignmentRating"/);
  assert.match(profile, /hasLegislatorProfile && showAlignmentRating/);
  assert.match(votes, /showAlignmentRating &&/);
  assert.match(endpoint, /\["showAlignmentRating", "show_alignment_rating"\]/);
  assert.match(people, /show_alignment_rating", "INTEGER NOT NULL DEFAULT 1"/);
  assert.match(gradeCache, /show_alignment_rating", "INTEGER NOT NULL DEFAULT 1"/);
});
