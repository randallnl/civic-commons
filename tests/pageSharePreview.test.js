import test from "node:test";
import assert from "node:assert/strict";
import {
  PAGE_SHARE_FALLBACK,
  pageShareConfig,
  pageShareImageUrl,
  pageShareStorageKey,
  pageShareTargetUrl,
  validPageShareKey,
} from "../src/lib/pageSharePreview.js";

test("free-staters share preview uses a versioned same-origin capture", () => {
  assert.equal(validPageShareKey("free-staters"), true);
  assert.equal(
    pageShareImageUrl("free-staters"),
    "https://nhdeservesbetter.com/api/page-preview/free-staters?v=v1-2026-10-15-history",
  );
  assert.equal(
    pageShareStorageKey("free-staters"),
    "page-share-previews/free-staters/v1-2026-10-15-history.jpg",
  );
  assert.equal(
    pageShareTargetUrl("free-staters"),
    "https://nhdeservesbetter.com/free-staters?share-preview=1",
  );
  assert.equal(pageShareConfig("free-staters")?.selector, ".free-staters-share-shell .history-evidence");
});

test("page screenshot targets are restricted to the allowlist", () => {
  for (const pageKey of ["", "../admin", "free-staters/other", "free-staters?next=evil", "admin"]) {
    assert.equal(validPageShareKey(pageKey), false);
    assert.equal(pageShareImageUrl(pageKey), PAGE_SHARE_FALLBACK);
    assert.equal(pageShareStorageKey(pageKey), "");
    assert.equal(pageShareTargetUrl(pageKey), "");
  }
});
