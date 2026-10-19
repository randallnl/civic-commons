import assert from "node:assert/strict";
import test from "node:test";
import {
  getCivicData,
  hasUsableCivicLocation,
  matchPlaceNameInAddress,
} from "../src/lib/civicLookupReliability.js";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("civic lookup retries a transient upstream failure", async () => {
  let calls = 0;
  const sleeps = [];
  const data = await getCivicData("82 Bobcat Way, Manchester, NH", "test-key", {
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) {
        return jsonResponse({ error: { message: "Upstream unavailable" } }, 503);
      }
      return jsonResponse({
        normalizedInput: { city: "Manchester", state: "NH" },
        divisions: {},
      });
    },
    sleep: async (milliseconds) => sleeps.push(milliseconds),
  });

  assert.equal(calls, 2);
  assert.deepEqual(sleeps, [175]);
  assert.equal(data.normalizedInput.city, "Manchester");
});

test("civic lookup does not amplify a quota response", async () => {
  let calls = 0;
  await assert.rejects(
    getCivicData("82 Bobcat Way, Manchester, NH", "test-key", {
      fetchImpl: async () => {
        calls += 1;
        return jsonResponse({ error: { message: "Quota exceeded" } }, 429);
      },
      sleep: async () => {},
    }),
    /Quota exceeded/,
  );
  assert.equal(calls, 1);
});

test("civic lookup does not retry a non-transient address error", async () => {
  let calls = 0;
  await assert.rejects(
    getCivicData("not an address", "test-key", {
      fetchImpl: async () => {
        calls += 1;
        return jsonResponse({ error: { message: "No information for this address" } }, 400);
      },
      sleep: async () => {},
    }),
    /No information for this address/,
  );
  assert.equal(calls, 1);
});

test("local town matching prefers the municipality nearest the end of an address", () => {
  const towns = ["Concord", "Manchester", "New Boston", "Boston"];
  assert.equal(
    matchPlaceNameInAddress("25 New Boston Road, Manchester, NH 03102", towns),
    "Manchester",
  );
  assert.equal(matchPlaceNameInAddress("Dover, NH", towns.concat("Dover")), "Dover");
  assert.equal(matchPlaceNameInAddress("Unknown place", towns), "");
});

test("usable civic data requires a town or legislative division", () => {
  assert.equal(hasUsableCivicLocation({ normalizedInput: { city: "Concord" } }), true);
  assert.equal(hasUsableCivicLocation({
    divisions: { "ocd-division/country:us/state:nh/sldu:15": { name: "District 15" } },
  }), true);
  assert.equal(hasUsableCivicLocation({ divisions: {} }), false);
});
