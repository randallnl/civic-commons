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

  const rollCalls = billPage.indexOf('<section class="panel roll-panel"');
  const contextFeed = billPage.indexOf('<section class="panel bill-context-panel"');
  const testimonySummary = billPage.indexOf('<section class="panel position-panel"');

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

test("bill pages provide anchored navigation and a concise mobile reading order", async () => {
  const billPage = await source("src/pages/bills/[bill].astro");

  assert.match(billPage, /class="bill-section-nav"/);
  assert.match(billPage, /href="#overview"/);
  assert.match(billPage, /href="#public-input"/);
  assert.match(billPage, /href="#votes"/);
  assert.match(billPage, /href="#organization-positions"/);
  assert.match(billPage, /href="#community-context"/);
  assert.match(billPage, /href="#testimony"/);
  assert.match(billPage, /class:list=\{\["at-a-glance panel"/);
  assert.match(billPage, /const visibleTestimony = testimony\.slice\(0, 5\)/);
  assert.match(billPage, /\.position-panel \{\s+order: 1;/);
  assert.match(billPage, /\.roll-panel \{\s+order: 2;/);
  assert.match(billPage, /\.bill-context-panel \{\s+order: 3;/);
  assert.match(billPage, /\.testimony-panel \{\s+order: 4;/);
});

test("bill pages support testimony filtering, progress disclosure, and copyable section links", async () => {
  const billPage = await source("src/pages/bills/[bill].astro");

  assert.match(billPage, /class="bill-progress"/);
  assert.match(billPage, /Bill progress based on the latest recorded action/);
  assert.match(billPage, /data-testimony-browser/);
  assert.match(billPage, /data-testimony-position="support"/);
  assert.match(billPage, /data-testimony-position="oppose"/);
  assert.match(billPage, /data-testimony-search/);
  assert.match(billPage, /of \$\{testimonyTotal\} recorded positions/);
  assert.match(billPage, /data-copy-section-link="votes"/);
  assert.match(billPage, /navigator\.clipboard\.writeText/);
});

test("bill section navigation follows the reader and becomes a compact mobile menu", async () => {
  const billPage = await source("src/pages/bills/[bill].astro");

  assert.match(billPage, /data-bill-section-nav/);
  assert.match(billPage, /data-bill-section-select/);
  assert.match(billPage, /data-bill-section-link="overview" aria-current="location"/);
  assert.match(billPage, /new IntersectionObserver/);
  assert.match(billPage, /scrollIntoView\(\{ behavior: "smooth", block: "start" \}\)/);
  assert.match(billPage, /class="bill-back-to-top" href="#overview"/);
  assert.match(billPage, /\.bill-section-select \{\s+display: grid;/);
  assert.match(billPage, /\.bill-section-links \{\s+display: none;/);
});

test("testimony totals open shareable filtered views and roll calls show vote balance", async () => {
  const billPage = await source("src/pages/bills/[bill].astro");

  assert.match(billPage, /data-testimony-jump-filter="support"/);
  assert.match(billPage, /data-testimony-jump-filter="oppose"/);
  assert.match(billPage, /url\.searchParams\.set\("testimony", selectedPosition\)/);
  assert.match(billPage, /searchParams\.get\("testimony"\)/);
  assert.match(billPage, /class="roll-balance"/);
  assert.match(billPage, /Yeas led by \$\{margin\}/);
  assert.match(billPage, /Nays led by \$\{margin\}/);
  assert.match(billPage, /rollCallShare\(latestRollCall\).*% yea/s);
});
