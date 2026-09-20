import test from "node:test";
import assert from "node:assert/strict";
import {
  communityUpdateShareImageUrl,
  communityUpdateShareStorageKey,
  PROFILE_SHARE_FALLBACK,
  profileShareImageUrl,
  profileShareStorageKey,
  validCommunityUpdateId,
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

test("community update share previews use validated profile and update identifiers", () => {
  assert.equal(
    communityUpdateShareImageUrl("susan-delemus-947", 108, "2026-09-20 12:34:56"),
    "https://nhdeservesbetter.com/api/profile-preview/susan-delemus-947?update=108&v=2026-09-20-12-34-56",
  );
  assert.equal(
    communityUpdateShareStorageKey("susan-delemus-947", 108, "2026-09-20 12:34:56"),
    "community-update-share-previews/susan-delemus-947/108/2026-09-20-12-34-56.jpg",
  );

  for (const value of ["", "0", "-1", "1.5", "108x", Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(validCommunityUpdateId(value), 0);
    assert.equal(communityUpdateShareImageUrl("susan-delemus-947", value), PROFILE_SHARE_FALLBACK);
    assert.equal(communityUpdateShareStorageKey("susan-delemus-947", value), "");
  }
});
