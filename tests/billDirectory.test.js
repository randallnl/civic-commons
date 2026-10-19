import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the bill directory supports live chamber, stage, and testimony filters", async () => {
  const page = await source("src/pages/bills/index.astro");

  assert.match(page, /pageSize: 24/);
  assert.match(page, /name="body" data-fuzzy-filter-field data-fuzzy-field="body"/);
  assert.match(page, /name="stage" data-fuzzy-filter-field data-fuzzy-field="stage"/);
  assert.match(page, /name="position" data-fuzzy-filter-field data-fuzzy-field="position"/);
  assert.match(page, /data-fuzzy-body=\{billBody\(bill\.legislativebody\)\}/);
  assert.match(page, /data-fuzzy-stage=\{billStage\(bill\.description\)\}/);
  assert.match(page, /data-fuzzy-position=\{testimonyLead\(bill\)\}/);
});

test("the bill directory progressively reveals results and sorts testimony numerically", async () => {
  const page = await source("src/pages/bills/index.astro");
  const enhancements = await source("src/components/ClientEnhancements.astro");

  assert.match(page, /data-fuzzy-matched-count/);
  assert.match(page, /data-fuzzy-more/);
  assert.match(page, /value="testimony:desc"/);
  assert.match(page, /data-fuzzy-sort-testimony=\{Number\(bill\.testimony_count \|\| 0\)\}/);
  assert.match(enhancements, /"missing", "testimony"/);
});
