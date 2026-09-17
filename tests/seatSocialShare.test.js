import assert from "node:assert/strict";
import test from "node:test";

import {
  groupCandidatesForSocialShare,
  seatSocialShareOptions,
  socialPostCopyForSeat,
  summarizeGraphicTowns,
} from "../src/lib/seatSocialShare.js";
import { MAX_CANDIDATE_GRAPHIC_TOWNS_LENGTH, validateContentGraphicRequest } from "../src/lib/contentGenerator.js";

test("groups candidates into ordered State House and State Senate share seats", () => {
  const seats = groupCandidatesForSocialShare([
    { office: "State Senate", district: "4", candidateFirstName: "Senate", candidateLastName: "Candidate" },
    { office: "State Representative", county: "Belknap", district: "2", candidateFirstName: "House", candidateLastName: "Candidate" },
    { office: "State Representative", county: "Belknap", district: "2", candidateFirstName: "Another", candidateLastName: "Candidate" },
  ]);

  assert.deepEqual(seats.map((seat) => seat.label), [
    "State Representative, Belknap, District 2",
    "State Senate, District 4",
  ]);
  assert.equal(seats[0].candidates.length, 2);
});

test("builds a seat share model with canonical candidate profiles and fallback portraits", () => {
  const seats = seatSocialShareOptions([
    {
      label: "State Representative, Merrimack, District 9",
      seats: 3,
      communitiesRepresented: "Concord · Bow · Hopkinton",
      candidates: [
        {
          filerEntityNumber: "12345",
          candidateFirstName: "Ada",
          candidateLastName: "Lovelace",
          office: "State Representative",
          county: "Merrimack",
          district: "9",
          politicalParty: "D",
          townsRepresented: ["Concord", "Bow", "Hopkinton"],
          photoUrl: "https://photos.example.test/ada.png",
          legislatorPhotoUrl: "https://photos.example.test/ada-current.png",
          isFreeStateAligned2026: 1,
          isTpActionAligned2026: true,
        },
        {
          filerEntityNumber: "67890",
          candidateFirstName: "Grace",
          candidateLastName: "Hopper",
        },
      ],
    },
  ], { origin: "https://nhdeservesbetter.com" });

  assert.equal(seats.length, 1);
  assert.equal(seats[0].seats, 3);
  assert.equal(seats[0].communitiesRepresented, "Concord · Bow · Hopkinton");
  assert.equal(seats[0].candidates[0].profileUrl, "https://nhdeservesbetter.com/people/12345-ada-lovelace");
  assert.equal(seats[0].candidates[0].portraitUrl, "https://photos.example.test/ada-current.png");
  assert.equal(seats[0].candidates[0].office, "State Representative · Merrimack · District 9");
  assert.equal(seats[0].candidates[0].party, "Democratic");
  assert.equal(seats[0].candidates[0].townsRepresented, "Concord · Bow · Hopkinton");
  assert.equal(seats[0].candidates[0].freeStateAligned, true);
  assert.equal(seats[0].candidates[0].tpactionAligned, true);
  assert.deepEqual(seats[0].candidates[0].tags, ["Free State Aligned", "TPAction Aligned"]);
  assert.equal(seats[0].candidates[1].portraitUrl, "https://nhdeservesbetter.com/nhdb-logo-circle.png");
});

test("creates ready-to-paste seat copy with every candidate profile link and a contribution route", () => {
  const post = socialPostCopyForSeat({
    label: "State Representative, Hillsborough, District 8",
    seats: 3,
    communitiesRepresented: "Nashua Ward 6",
    candidates: [
      {
        name: "Ada Lovelace",
        profileUrl: "https://nhdeservesbetter.com/people/ada-lovelace",
      },
      { name: "Grace Hopper", profileUrl: "https://nhdeservesbetter.com/people/grace-hopper" },
    ],
  }, {
    suggestUpdateUrl: "https://nhdeservesbetter.com/suggest-update",
  });

  assert.match(post, /^Do you know your candidates\?/);
  assert.match(post, /For State Representative, Hillsborough, District 8, there are 3 seats and 2 candidates\./);
  assert.match(post, /This district represents Nashua Ward 6\./);
  assert.match(post, /Your candidates are:/);
  assert.match(post, /Ada Lovelace: https:\/\/nhdeservesbetter\.com\/people\/ada-lovelace/);
  assert.match(post, /Grace Hopper: https:\/\/nhdeservesbetter\.com\/people\/grace-hopper/);
  assert.match(post, /Get to know your candidates or share information to keep others informed\./);
  assert.doesNotMatch(post, /offers insights on published endorsements/i);
  assert.match(post, /Share verifiable information/i);
  assert.match(post, /https:\/\/nhdeservesbetter\.com\/suggest-update/);
});

test("Senate District 7 graphics fit the renderer's town limit without cutting a town name", () => {
  const districtTowns = "Alexandria, Andover, Boscawen, Bradford, Bridgewater, Bristol, Danbury, Franklin-Ward 1, Franklin-Ward 2, Franklin-Ward 3, Goshen, Grafton, Hebron, Henniker, Hill, Hillsborough, Newbury, Orange, Salisbury, Sutton, Tilton, Warner, Webster, Wilmot";
  const [seat] = seatSocialShareOptions([{
    label: "State Senate, District 7",
    candidates: [
      { filerEntityNumber: "218747", name: "Daniel Innis", office: "State Senate", district: "7", townsRepresented: districtTowns },
      { filerEntityNumber: "243715", name: "Rebecca Harned", office: "State Senate", district: "7", townsRepresented: districtTowns },
    ],
  }], { origin: "https://nhdeservesbetter.com" });

  assert.equal(seat.candidates.length, 2);
  for (const candidate of seat.candidates) {
    assert.ok(candidate.townsRepresented.length <= MAX_CANDIDATE_GRAPHIC_TOWNS_LENGTH);
    assert.match(candidate.townsRepresented, /Alexandria · Andover/);
    assert.match(candidate.townsRepresented, /\+\d+ more communities$/);
    const validation = validateContentGraphicRequest({
      eventId: "7b8aeada-aeb8-4ee8-9c91-3dbb45b1af96",
      entityType: "candidate",
      entityId: candidate.entityId,
      template: "candidate-profile-update",
      headline: candidate.name,
      office: candidate.office,
      townsRepresented: candidate.townsRepresented,
      body: "Get to know your candidate.",
      image: candidate.portraitUrl,
    });
    assert.equal(validation.ok, true);
  }
});

test("graphic town summaries preserve shorter lists and ward-qualified communities", () => {
  assert.equal(summarizeGraphicTowns("Concord · Bow · Hopkinton"), "Concord · Bow · Hopkinton");
  const [seat] = seatSocialShareOptions([{
    label: "State Representative, Hillsborough, District 1",
    candidates: [{ filerEntityNumber: "123", name: "Sample Candidate", townsRepresented: "Manchester, Ward 1, Nashua, Ward 2" }],
  }], { origin: "https://nhdeservesbetter.com" });
  assert.equal(seat.candidates[0].townsRepresented, "Manchester, Ward 1 · Nashua, Ward 2");
});
