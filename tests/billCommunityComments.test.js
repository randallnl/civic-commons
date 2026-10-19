import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("bill community comments persist structured metadata and canonical person tags", async () => {
  const [communityUpdates, submissionApi, mentionApi] = await Promise.all([
    source("src/lib/communityUpdates.js"),
    source("src/pages/api/community-updates.ts"),
    source("src/pages/api/mentions/people.ts"),
  ]);

  assert.match(communityUpdates, /content_type TEXT NOT NULL DEFAULT 'community_comment'/);
  assert.match(communityUpdates, /bill_position TEXT/);
  assert.match(communityUpdates, /statement_format TEXT/);
  assert.match(communityUpdates, /getApprovedCommunityUpdatesForPerson/);
  assert.match(communityUpdates, /selectedPersonIds/);
  assert.match(submissionApi, /taggedPersonIds/);
  assert.match(submissionApi, /Add a source link for a candidate or legislator statement/);
  assert.match(mentionApi, /data-person-id/);
});

test("bill pages present specialized comment controls and filters", async () => {
  const [component, billPage, peoplePage] = await Promise.all([
    source("src/components/CommunityUpdates.astro"),
    source("src/pages/bills/[bill].astro"),
    source("src/pages/people/[slug].astro"),
  ]);

  assert.match(component, /Community Comments on This Bill/);
  assert.match(component, /Candidate or legislator statement/);
  assert.match(component, /data-position-filter/);
  assert.match(component, /data-person-filter/);
  assert.match(component, /name="taggedPersonIds"/);
  assert.match(billPage, /showAnchorLinks=\{true\}/);
  assert.match(peoplePage, /relatedPersonId=\{canonicalPersonId\}/);
});

test("bill pages combine comments and articles beneath the vote rail", async () => {
  const billPage = await source("src/pages/bills/[bill].astro");

  const rollCalls = billPage.indexOf('<section class="panel roll-panel">');
  const contextFeed = billPage.indexOf('<section class="panel bill-context-panel">');
  const testimonySummary = billPage.indexOf('<section class="panel position-panel">');

  assert.ok(rollCalls >= 0);
  assert.ok(contextFeed > rollCalls);
  assert.ok(testimonySummary > contextFeed);
  assert.match(billPage, /id="bill-context-tab-all" checked/);
  assert.match(billPage, /Community comments/);
  assert.match(billPage, /<ArticleList/);
  assert.match(billPage, /embedded=\{true\}/);
  assert.match(billPage, /\.bill-detail-rail \{/);
  assert.doesNotMatch(billPage, /vote-summary-grid/);
  assert.doesNotMatch(billPage, /content-grid/);
});
