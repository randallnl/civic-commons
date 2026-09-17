import assert from "node:assert/strict";
import test from "node:test";
import { enrichPerson, getFreeStateAlignedPeople, hasValidAlignmentPercent, personRoleFilterValue } from "../src/lib/freeStaterDirectory.js";

test("person-based directory loads each labeled person once with overlapping roles", async () => {
  const statements = [];
  const db = {
    prepare(sql) {
      statements.push(sql);
      return {
        async all() {
          if (sql.includes("FROM d1_people p")) {
            return {
              results: [
                {
                  id: 1, slug: "alex-example", display_name: "Alex Example",
                  is_current_legislator: 1, is_2026_candidate: 1,
                  legislator_role_id: 11, candidate_role_id: 21,
                  legislativebody: "H", countycode: "06", legislator_district: "12",
                  candidate_office: "State Representative", candidate_county: "Hillsborough", candidate_district: "12",
                },
                {
                  id: 2, slug: "blair-example", display_name: "Blair Example",
                  is_current_legislator: 0, is_2026_candidate: 1,
                  legislator_role_id: null, candidate_role_id: 22,
                  candidate_office: "State Senate", candidate_county: "Rockingham", candidate_district: "4",
                },
                {
                  id: 3, slug: "casey-example", display_name: "Casey Example",
                  is_current_legislator: 0, is_2026_candidate: 0,
                  legislator_role_id: null, candidate_role_id: null,
                },
              ],
            };
          }
          return {
            results: [
              { body: "H", county: 6, district: 12, district_label: "Hillsborough 12", communities_represented: "Manchester", counties_represented: "Hillsborough" },
              { body: "S", county: null, district: 4, district_label: "Senate District 4", communities_represented: "Dover", counties_represented: "Strafford" },
            ],
          };
        },
      };
    },
  };

  const people = await getFreeStateAlignedPeople(db);
  assert.equal(people.length, 3);
  assert.equal(new Set(people.map((person) => person.id)).size, 3);
  assert.equal(people[0].isCurrentLegislator, true);
  assert.equal(people[0].isCurrentCandidate, true);
  assert.equal(personRoleFilterValue(people[0]), "legislators candidates");
  assert.deepEqual(people[0].towns, ["Manchester"]);
  assert.equal(people[1].isCurrentLegislator, false);
  assert.equal(people[1].isCurrentCandidate, true);
  assert.equal(personRoleFilterValue(people[1]), "candidates");
  assert.deepEqual(people[1].towns, ["Dover"]);
  assert.equal(people[2].isCurrentLegislator, false);
  assert.equal(people[2].isCurrentCandidate, false);
  assert.equal(personRoleFilterValue(people[2]), "none");
  assert.match(statements[0], /WHERE p\.is_free_state_aligned_2026 = 1/);
  assert.match(statements[0], /role\.status = 'active'/);
});

test("an archived candidacy does not qualify for the current candidate filter", () => {
  const person = enrichPerson({
    id: 4, is_current_legislator: 0, is_2026_candidate: 1,
    legislator_role_id: null, candidate_role_id: null,
  });
  assert.equal(person.isCurrentCandidate, false);
});

test("missing alignment sentinels are not displayed as percentages", () => {
  assert.equal(hasValidAlignmentPercent(-1), false);
  assert.equal(hasValidAlignmentPercent(null), false);
  assert.equal(hasValidAlignmentPercent(0), true);
  assert.equal(hasValidAlignmentPercent(100), true);
});

test("senators use Senate district labels and represented counties", () => {
  const districts = new Map([
    ["S::23", { district_label: "23", communities_represented: "Exeter", counties_represented: "Rockingham" }],
  ]);
  const person = enrichPerson({
    id: 5, is_current_legislator: 1, is_2026_candidate: 1,
    legislator_role_id: 11, candidate_role_id: 22,
    legislativebody: "S", countycode: "10", legislator_district: "23",
    candidate_office: "State Senator", candidate_county: "Sullivan", candidate_district: "23",
  }, districts);
  assert.equal(person.districtLabel, "Senate District 23");
  assert.equal(person.candidateDistrictLabel, "Senate District 23");
  assert.deepEqual(person.counties, ["Rockingham"]);
  assert.equal(person.body, "senate");
});
