import assert from "node:assert/strict";
import test from "node:test";

import {
  seatSocialShareOptions,
  socialPostCopyForSeat,
} from "../src/lib/seatSocialShare.js";

test("builds a seat share model with canonical candidate profiles and fallback portraits", () => {
  const seats = seatSocialShareOptions([
    {
      label: "State Representative, Merrimack, District 9",
      candidates: [
        {
          filerEntityNumber: "12345",
          candidateFirstName: "Ada",
          candidateLastName: "Lovelace",
          photoUrl: "https://photos.example.test/ada.png",
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
  assert.equal(seats[0].candidates[1].portraitUrl, "https://nhdeservesbetter.com/nhdb-logo-circle.png");
});

test("creates ready-to-paste seat copy with every candidate profile link and a contribution route", () => {
  const post = socialPostCopyForSeat({
    label: "State Senate, District 6",
    candidates: [
      { name: "Ada Lovelace", profileUrl: "https://nhdeservesbetter.com/people/ada-lovelace" },
      { name: "Grace Hopper", profileUrl: "https://nhdeservesbetter.com/people/grace-hopper" },
    ],
  }, {
    suggestUpdateUrl: "https://nhdeservesbetter.com/suggest-update",
  });

  assert.match(post, /^Do you know your candidates\?/);
  assert.match(post, /For State Senate, District 6, your candidates are:/);
  assert.match(post, /Ada Lovelace: https:\/\/nhdeservesbetter\.com\/people\/ada-lovelace/);
  assert.match(post, /Grace Hopper: https:\/\/nhdeservesbetter\.com\/people\/grace-hopper/);
  assert.match(post, /verifiable information/i);
  assert.match(post, /https:\/\/nhdeservesbetter\.com\/suggest-update/);
});
