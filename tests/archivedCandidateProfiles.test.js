import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import {
  candidateRoleVisibilitySql,
  isCurrentCandidateRecord,
} from "../src/lib/candidateVisibility.js";

test("directory and address lookups only include active candidate roles", () => {
  const scope = candidateRoleVisibilitySql();
  assert.match(scope.joinCondition, /cr\.status = 'active'/);
  assert.match(scope.personWhere, /p\.is_2026_candidate = 1/);
  assert.match(scope.personWhere, /cr\.id IS NOT NULL OR NOT EXISTS/);
});

test("direct profile lookup can read retained archived candidacies", () => {
  const scope = candidateRoleVisibilitySql({ includeInactive: true });
  assert.equal(scope.joinCondition, "");
  assert.match(scope.personWhere, /cr\.id IS NOT NULL/);
  assert.doesNotMatch(scope.personWhere, /is_2026_candidate = 1/);
});

test("the same records are hidden in directory SQL but available to direct profile SQL", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE d1_people (
      id INTEGER PRIMARY KEY, slug TEXT, filer_entity_number TEXT,
      is_2026_candidate INTEGER
    );
    CREATE TABLE d1_person_candidate_roles (
      id INTEGER PRIMARY KEY, person_id INTEGER, election_year INTEGER,
      status TEXT
    );
    INSERT INTO d1_people VALUES
      (1, 'current', '1', 1),
      (2, 'archived', '2', 0),
      (3, 'stale-flag', '3', 1),
      (4, 'legacy-current', '4', 1);
    INSERT INTO d1_person_candidate_roles VALUES
      (1, 1, 2026, 'active'),
      (2, 2, 2026, 'lost_primary'),
      (3, 3, 2026, 'lost_primary');
  `);
  const query = (scope) => db.prepare(`
    SELECT p.slug FROM d1_people p
    LEFT JOIN d1_person_candidate_roles cr
      ON cr.person_id = p.id ${scope.joinCondition}
    WHERE ${scope.personWhere}
    ORDER BY p.id
  `).all().map((row) => row.slug);

  assert.deepEqual(query(candidateRoleVisibilitySql()), ["current", "legacy-current"]);
  assert.deepEqual(query(candidateRoleVisibilitySql({ includeInactive: true })),
    ["current", "archived", "stale-flag", "legacy-current"]);
  db.close();
});

test("former candidates do not become current candidate roles on legislator profiles", () => {
  assert.equal(isCurrentCandidateRecord({ candidacyStatus: "active", isCurrentCandidate: true }), true);
  assert.equal(isCurrentCandidateRecord({ candidacyStatus: "lost_primary", isCurrentCandidate: false }), false);
  assert.equal(isCurrentCandidateRecord({ candidacyStatus: "active", electionYear: 2024 }), false);
  assert.equal(isCurrentCandidateRecord({ candidacyStatus: "inactive" }), false);
  assert.equal(isCurrentCandidateRecord(null), false);
});
