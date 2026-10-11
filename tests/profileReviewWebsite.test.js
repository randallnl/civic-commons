import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import {
  hasReviewWebsite,
  MISSING_REVIEW_WEBSITE_SQL,
} from "../src/lib/profileReviewWebsite.js";

test("profile review accepts a saved Facebook page when the website field is empty", () => {
  assert.equal(hasReviewWebsite({ candidate_website: "", facebook_url: "https://www.facebook.com/example" }), true);
  assert.equal(hasReviewWebsite({ candidate_website: "https://example.org", facebook_url: "" }), true);
  assert.equal(hasReviewWebsite({ candidate_website: "  ", facebook_url: "  " }), false);
});

test("the review queue SQL excludes Facebook pages from missing-website results", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE profiles (id INTEGER, candidate_website TEXT, facebook_url TEXT);
    INSERT INTO profiles VALUES
      (1, '', ''),
      (2, NULL, 'https://www.facebook.com/example'),
      (3, 'https://example.org', NULL),
      (4, '  ', '  ');
  `);
  const rows = db.prepare(`SELECT id FROM profiles WHERE ${MISSING_REVIEW_WEBSITE_SQL} ORDER BY id`).all();
  assert.deepEqual(rows.map((row) => row.id), [1, 4]);
  db.close();
});
