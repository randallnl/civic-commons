#!/usr/bin/env node

import { writeFile } from "node:fs/promises";

const AP_BASE =
  "https://interactives.apelections.org/election-results/customers/layouts/organization-layouts/published/128298";
const DATA_BASE =
  "https://interactives.apelections.org/election-results/data-live";
const ELECTION_DATE = "2026-09-08";
const STATE = "NH";

const layouts = {
  GOP: [31930, 31932, 31934, 31936, 32045, 32047, 32049, 32051, 32627, 32053, 32626, 32055, 32057],
  Dem: [31931, 31933, 31935, 31937, 32046, 32048, 32050, 32052, 32628, 32054, 32629, 32056, 32058],
};

const headers = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128.0 Safari/537.36",
  referer: "https://www.nhpr.org/",
};

async function fetchText(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  return response.text();
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url));
}

function parseSlots(html, layoutId, party) {
  const match = html.match(
    /<script id="layout-config" type="application\/json">\s*([\s\S]*?)\s*<\/script>/,
  );
  if (!match) throw new Error(`Missing layout-config for ${layoutId}`);
  const config = JSON.parse(match[1]);
  const grid = JSON.parse(config.grid);
  return grid.slots
    .filter((slot) => slot.visualization === "SummaryTable")
    .map((slot) => ({
      party,
      layoutId,
      date: slot.date,
      label: slot.label,
      raceID: slot.props?.raceID,
      state: slot.props?.state,
    }))
    .filter((slot) => slot.raceID && slot.state === STATE);
}

async function loadRace(slot) {
  const prefix = `${DATA_BASE}/${slot.date}/results/races/${slot.state}/${slot.raceID}`;
  const [metadata, summary] = await Promise.all([
    fetchJson(`${prefix}/metadata.json`),
    fetchJson(`${prefix}/summary.json`),
  ]);
  const resultByCandidate = new Map(
    (summary.candidates || []).map((candidate) => [candidate.candidateID, candidate]),
  );
  const candidates = Object.values(metadata.candidates || {}).map((candidate) => {
    const result = resultByCandidate.get(candidate.candidateID) || {};
    return {
      candidateID: candidate.candidateID,
      first: candidate.first || "",
      middle: candidate.middle || "",
      last: candidate.last || "",
      suffix: candidate.suffix || "",
      party: candidate.party || metadata.party || slot.party,
      incumbent: Boolean(candidate.incumbent),
      voteCount: result.voteCount ?? null,
      votePct: result.votePct ?? null,
      winner: result.winner === "X",
      runoff: result.winner === "R",
    };
  });
  return {
    source: `${AP_BASE}/${slot.layoutId}.html`,
    electionDate: metadata.electionDate,
    raceID: metadata.raceID,
    party: metadata.party || slot.party,
    officeID: metadata.officeID,
    officeName: metadata.officeName,
    county: metadata.countyName || metadata.county || null,
    seatName: metadata.seatName,
    seatNum: metadata.seatNum,
    numWinners: metadata.numWinners || 1,
    uncontested: Boolean(metadata.uncontested),
    raceCallStatus: metadata.raceCallStatus,
    isCertified: Boolean(metadata.isCertified),
    lastUpdated: summary.lastUpdated,
    candidates,
  };
}

const slots = [];
for (const [party, ids] of Object.entries(layouts)) {
  for (const layoutId of ids) {
    const html = await fetchText(`${AP_BASE}/${layoutId}.html`);
    slots.push(...parseSlots(html, layoutId, party));
  }
}

const uniqueSlots = [...new Map(slots.map((slot) => [slot.raceID, slot])).values()];
const races = [];
for (let index = 0; index < uniqueSlots.length; index += 12) {
  races.push(...(await Promise.all(uniqueSlots.slice(index, index + 12).map(loadRace))));
}
races.sort((a, b) => a.raceID.localeCompare(b.raceID));

const outputPath = process.argv[2];
const output = `${JSON.stringify({ electionDate: ELECTION_DATE, races }, null, 2)}\n`;
if (outputPath) {
  await writeFile(outputPath, output);
} else {
  process.stdout.write(output);
}

