import test from "node:test";
import assert from "node:assert/strict";
import {
  PROFILE_SHARE_FALLBACK,
  profileShareImageUrl,
  profileShareStorageKey,
  validProfileSlug,
} from "../src/lib/profileSharePreview.js";

test("profile share URLs use the canonical person slug and revision", () => {
  assert.equal(
    profileShareImageUrl("marissa-salisbury", "2026-09-17 12:34:56"),
    "https://nhdeservesbetter.com/api/profile-preview/marissa-salisbury?v=2026-09-17-12-34-56",
  );
  assert.equal(
    profileShareStorageKey("marissa-salisbury", "2026-09-17 12:34:56"),
    "profile-share-previews/marissa-salisbury/2026-09-17-12-34-56.jpg",
  );
});

test("invalid profile slugs cannot become screenshot targets or R2 paths", () => {
  for (const slug of ["", "../admin", "a?url=evil", "UPPER", "a/b", "a%2Fb"]) {
    assert.equal(validProfileSlug(slug), false);
    assert.equal(profileShareImageUrl(slug), PROFILE_SHARE_FALLBACK);
    assert.equal(profileShareStorageKey(slug), "");
  }
});
