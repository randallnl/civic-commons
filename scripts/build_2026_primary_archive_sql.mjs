#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const [resultsPath, rolesPath, outputPath] = process.argv.slice(2);
if (!resultsPath || !rolesPath || !outputPath) {
  throw new Error(
    "Usage: node scripts/build_2026_primary_archive_sql.mjs RESULTS.json ROLES.json OUTPUT.sql",
  );
}

const results = JSON.parse(await readFile(resultsPath, "utf8"));
const rolePayload = JSON.parse(await readFile(rolesPath, "utf8"));
const roles = Array.isArray(rolePayload) && rolePayload[0]?.results
  ? rolePayload[0].results
  : rolePayload.results || rolePayload;

const NHPR_SOURCES = {
  Dem: "https://www.nhpr.org/elections/primary-2026/results/dem-state-house-senate",
  GOP: "https://www.nhpr.org/elections/primary-2026/results/gop-state-house-senate",
};

function normalizeName(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(jr|sr|ii|iii|iv)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeParty(value) {
  if (/dem/i.test(value || "")) return "Dem";
  if (/rep|gop/i.test(value || "")) return "GOP";
  return normalizeName(value);
}

function raceParts(race) {
  if (race.officeID === "Z") {
    return { county: "", district: String(Number(race.seatNum)) };
  }
  const match = String(race.seatName || "").match(/^(.+?) District (\d+)$/);
  if (!match) throw new Error(`Unrecognized House seat name: ${race.seatName}`);
  return { county: match[1], district: String(Number(match[2])) };
}

function sameRace(role, race) {
  const { county, district } = raceParts(race);
  const officeMatches = race.officeID === "Z"
    ? role.office === "State Senate"
    : role.office === "State Representative";
  return officeMatches &&
    String(Number(role.district)) === district &&
    normalizeParty(role.political_party) === normalizeParty(race.party) &&
    (race.officeID === "Z" || normalizeName(role.county) === normalizeName(county));
}

function isWriteIn(candidate) {
  return /write-?ins?/i.test(`${candidate.first || ""} ${candidate.last || ""}`);
}

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

const calledContestedRaces = results.races.filter((race) => {
  const namedCandidates = race.candidates.filter((candidate) => !isWriteIn(candidate));
  return race.raceCallStatus === "Called" &&
    !race.uncontested &&
    namedCandidates.length > race.numWinners;
});

const matches = [];
for (const race of calledContestedRaces) {
  const pool = roles.filter((role) => sameRace(role, race));
  for (const candidate of race.candidates.filter(
    (item) => !item.winner && !item.runoff && !isWriteIn(item),
  )) {
    const exact = pool.filter(
      (role) => normalizeName(role.firstname) === normalizeName(candidate.first) &&
        normalizeName(role.lastname) === normalizeName(candidate.last),
    );
    const sameLastName = pool.filter(
      (role) => normalizeName(role.lastname) === normalizeName(candidate.last),
    );
    const role = exact.length === 1
      ? exact[0]
      : sameLastName.length === 1
        ? sameLastName[0]
        : null;
    if (!role) {
      throw new Error(
        `Could not uniquely match ${candidate.first} ${candidate.last} in ${race.party} ${race.seatName}`,
      );
    }
    const { county, district } = raceParts(race);
    matches.push({
      role,
      race,
      candidate,
      county: race.officeID === "Y" ? county : null,
      district,
      totalContestVotes: race.candidates.reduce(
        (total, item) => total + (Number(item.voteCount) || 0),
        0,
      ),
    });
  }
}

const statements = [
  ...matches.map(({ role, race, candidate, county, district, totalContestVotes }) => {
    const sourceUrl = NHPR_SOURCES[race.party];
    const values = [
      role.person_id,
      role.role_id,
      role.filer_entity_number,
      race.electionDate,
      race.party,
      race.officeName,
      county,
      district,
      candidate.voteCount,
      candidate.votePct,
      totalContestVotes,
      race.numWinners,
      race.raceID,
      race.raceCallStatus,
      sourceUrl,
    ].map(sql);
    return `INSERT INTO d1_candidate_primary_results (
  person_id, candidate_role_id, filer_entity_number, election_year,
  election_date, election_type, party, office, county, district, outcome,
  votes_received, vote_percentage, total_contest_votes, seats_available,
  external_race_id, result_status, source_url, updated_at
)
VALUES (${values[0]}, ${values[1]}, ${values[2]}, 2026, ${values[3]}, 'primary',
  ${values[4]}, ${values[5]}, ${values[6]}, ${values[7]}, 'lost_primary',
  ${values[8]}, ${values[9]}, ${values[10]}, ${values[11]}, ${values[12]},
  ${values[13]}, ${values[14]}, CURRENT_TIMESTAMP)
ON CONFLICT(filer_entity_number, election_date, election_type) DO UPDATE SET
  outcome = excluded.outcome,
  votes_received = excluded.votes_received,
  vote_percentage = excluded.vote_percentage,
  total_contest_votes = excluded.total_contest_votes,
  seats_available = excluded.seats_available,
  external_race_id = excluded.external_race_id,
  result_status = excluded.result_status,
  source_url = excluded.source_url,
  updated_at = CURRENT_TIMESTAMP;`;
  }),
  ...matches.map(({ role, race, candidate, totalContestVotes }) =>
    `UPDATE d1_person_candidate_roles
SET status = 'lost_primary',
    votes_received = ${sql(candidate.voteCount)},
    total_contest_votes = ${sql(totalContestVotes)},
    seats_available = ${sql(race.numWinners)},
    election_result_source = ${sql(NHPR_SOURCES[race.party])},
    updated_at = CURRENT_TIMESTAMP
WHERE id = ${sql(role.role_id)} AND filer_entity_number = ${sql(role.filer_entity_number)};`,
  ),
  `UPDATE d1_people
SET is_2026_candidate = CASE WHEN EXISTS (
      SELECT 1
      FROM d1_person_candidate_roles active_role
      WHERE active_role.person_id = d1_people.id
        AND active_role.election_year = 2026
        AND active_role.status = 'active'
    ) THEN 1 ELSE 0 END,
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (
  SELECT person_id
  FROM d1_candidate_primary_results
  WHERE election_year = 2026 AND outcome = 'lost_primary'
);`,
  "",
];

await writeFile(outputPath, statements.join("\n\n"));
process.stdout.write(
  `${JSON.stringify({ races: calledContestedRaces.length, archivedCandidates: matches.length })}\n`,
);
