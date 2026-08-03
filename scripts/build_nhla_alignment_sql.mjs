import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const sourceFiles = [
  new URL("../audits/NHLA-Ratings-2026/House-Table 1.csv", import.meta.url),
  new URL("../audits/NHLA-Ratings-2026/Senate-Table 1.csv", import.meta.url),
];

const qualifyingGrades = new Set(["A+", "A", "A-", "B+"]);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== "\r") {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  const [headers, ...records] = rows;
  return records
    .filter((record) => record.some(Boolean))
    .map((record) =>
      Object.fromEntries(headers.map((header, index) => [header, record[index] || ""]))
    );
}

const ratings = sourceFiles.flatMap((file) => parseCsv(readFileSync(file, "utf8")));
const qualifyingEmployeeNos = ratings
  .filter((rating) => qualifyingGrades.has((rating.CombinedGrade || "").trim()))
  .map((rating) => Number(rating.EmployeeNo))
  .filter(Number.isFinite);

const sql = `UPDATE d1_people
SET is_free_state_aligned_2026 = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE is_free_state_aligned_2026 != 0;

UPDATE d1_people
SET is_free_state_aligned_2026 = 1,
    updated_at = CURRENT_TIMESTAMP
WHERE employeeno IN (${qualifyingEmployeeNos.join(", ")});

DELETE FROM organization_endorsements
WHERE organization_slug = 'new-hampshire-liberty-alliance'
  AND position = 'Free State Aligned'
  AND (
    statement LIKE '%combined grade of B.%'
    OR statement LIKE '%combined grade of B-.%'
  );
`;

mkdirSync(new URL("../tmp/nhla_alignment/", import.meta.url), { recursive: true });
writeFileSync(new URL("../tmp/nhla_alignment/free-state-aligned-2026.sql", import.meta.url), sql);

const gradeCounts = ratings.reduce((counts, rating) => {
  const grade = (rating.CombinedGrade || "Unknown").trim() || "Unknown";
  counts.set(grade, (counts.get(grade) || 0) + 1);
  return counts;
}, new Map());

console.log(`Wrote ${qualifyingEmployeeNos.length} qualifying NHLA aligned employee numbers.`);
console.log(
  [...gradeCounts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([grade, count]) => `${grade}: ${count}`)
    .join(", ")
);
