import assert from "node:assert/strict";
import test from "node:test";

import {
  groupCandidatesForSocialShare,
  seatSocialShareOptions,
  socialPostCopyForSeat,
} from "../src/lib/seatSocialShare.js";

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
  assert.equal(seats[0].candidates[0].profileUrl, "https://nhdeservesbetter.com/people/12345-ada-lovelace");
  assert.equal(seats[0].candidates[0].portraitUrl, "https://photos.example.test/ada.png");
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
    label: "State Senate, District 6",
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
  assert.match(post, /For State Senate, District 6, your candidates are:/);
  assert.match(post, /Ada Lovelace: https:\/\/nhdeservesbetter\.com\/people\/ada-lovelace/);
  assert.match(post, /Grace Hopper: https:\/\/nhdeservesbetter\.com\/people\/grace-hopper/);
  assert.match(post, /Get to know your candidates or share information to keep others informed\./);
  assert.match(post, /published endorsements, mentions in the news, and community input/i);
  assert.match(post, /Share verifiable information/i);
  assert.match(post, /https:\/\/nhdeservesbetter\.com\/suggest-update/);
});
