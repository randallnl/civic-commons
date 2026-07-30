import { mkdirSync, writeFileSync } from "node:fs";

const rowsText = `
BE8 3 State House District Belknap 03
BE8 4 State House District Belknap 04
CA7 105 State House District Carroll 05
CA7 106 State House District Carroll 06
CA8 103 State House District Carroll 03
CA8 104 State House District Carroll 04
CH15 201 State House District Cheshire 01
CH15 202 State House District Cheshire 02
CH15 203 State House District Cheshire 03
CH15 204 State House District Cheshire 04
CH15 205 State House District Cheshire 05
CH15 206 State House District Cheshire 06
CH16 207 State House District Cheshire 07
CH16 208 State House District Cheshire 08
CH16 209 State House District Cheshire 09
CH17 210 State House District Cheshire 10
CH17 211 State House District Cheshire 11
CH17 212 State House District Cheshire 12
CH18 213 State House District Cheshire 13
CH18 214 State House District Cheshire 14
CO7 304 State House District Coos 04
CO7 305 State House District Coos 05
GR17 413 State House District Grafton 13
GR17 414 State House District Grafton 14
GR17 415 State House District Grafton 15
GR18 409 State House District Grafton 09
GR18 410 State House District Grafton 10
GR18 411 State House District Grafton 11
GR18 416 State House District Grafton 16
HI37 534 State House District Hillsborough 34
HI37 543 State House District Hillsborough 43
HI38 513 State House District Hillsborough 13
HI38 514 State House District Hillsborough 14
HI39 515 State House District Hillsborough 15
HI39 516 State House District Hillsborough 16
HI39 520 State House District Hillsborough 20
HI40 518 State House District Hillsborough 18
HI40 519 State House District Hillsborough 19
HI40 521 State House District Hillsborough 21
HI40 522 State House District Hillsborough 22
HI40 523 State House District Hillsborough 23
HI41 517 State House District Hillsborough 17
HI41 524 State House District Hillsborough 24
HI41 525 State House District Hillsborough 25
HI41 526 State House District Hillsborough 26
HI44 528 State House District Hillsborough 28
HI44 529 State House District Hillsborough 29
HI45 535 State House District Hillsborough 35
HI45 536 State House District Hillsborough 36
ME25 602 State House District Merrimack 02
ME25 603 State House District Merrimack 03
ME26 601 State House District Merrimack 01
ME26 604 State House District Merrimack 04
ME26 605 State House District Merrimack 05
ME27 610 State House District Merrimack 10
ME27 611 State House District Merrimack 11
ME27 614 State House District Merrimack 14
ME28 615 State House District Merrimack 15
ME28 616 State House District Merrimack 16
ME28 617 State House District Merrimack 17
ME29 618 State House District Merrimack 18
ME29 623 State House District Merrimack 23
ME29 624 State House District Merrimack 24
ME30 619 State House District Merrimack 19
ME30 620 State House District Merrimack 20
ME30 621 State House District Merrimack 21
ME30 622 State House District Merrimack 22
RO31 702 State House District Rockingham 02
RO31 703 State House District Rockingham 03
RO32 706 State House District Rockingham 06
RO32 707 State House District Rockingham 07
RO32 708 State House District Rockingham 08
RO33 710 State House District Rockingham 10
RO33 711 State House District Rockingham 11
RO33 712 State House District Rockingham 12
RO34 714 State House District Rockingham 14
RO34 715 State House District Rockingham 15
RO35 716 State House District Rockingham 16
RO35 717 State House District Rockingham 17
RO36 719 State House District Rockingham 19
RO36 720 State House District Rockingham 20
RO37 721 State House District Rockingham 21
RO37 722 State House District Rockingham 22
RO38 723 State House District Rockingham 23
RO38 724 State House District Rockingham 24
RO39 726 State House District Rockingham 26
RO39 727 State House District Rockingham 27
RO39 728 State House District Rockingham 28
RO40 729 State House District Rockingham 29
RO40 730 State House District Rockingham 30
ST18 803 State House District Strafford 03
ST18 804 State House District Strafford 04
ST19 805 State House District Strafford 05
ST19 806 State House District Strafford 06
ST19 807 State House District Strafford 07
ST19 808 State House District Strafford 08
ST19 809 State House District Strafford 09
ST20 810 State House District Strafford 10
ST20 811 State House District Strafford 11
ST21 813 State House District Strafford 13
ST21 814 State House District Strafford 14
ST21 815 State House District Strafford 15
ST21 816 State House District Strafford 16
ST21 817 State House District Strafford 17
SU7 902 State House District Sullivan 02
SU7 903 State House District Sullivan 03
SU8 904 State House District Sullivan 04
SU8 905 State House District Sullivan 05
SU8 906 State House District Sullivan 06
`;

const countyByPrefix = {
  BE: ["Belknap", 1],
  CA: ["Carroll", 2],
  CH: ["Cheshire", 3],
  CO: ["Coos", 4],
  GR: ["Grafton", 5],
  HI: ["Hillsborough", 6],
  ME: ["Merrimack", 7],
  RO: ["Rockingham", 8],
  ST: ["Strafford", 9],
  SU: ["Sullivan", 10],
};

const sqlString = (value) => `'${String(value).replace(/'/g, "''")}'`;

const rows = rowsText
  .trim()
  .split("\n")
  .map((line) => {
    const match = line.match(/^([A-Z]+)(\d+)\s+(\d+)\s+State House District\s+(.+)\s+(\d+)$/);
    if (!match) throw new Error(`Could not parse line: ${line}`);

    const [, prefix, floterialDistrict, sldlCode, componentCounty, componentDistrict] = match;
    const floterialCounty = countyByPrefix[prefix];
    const componentCountyEntry = Object.values(countyByPrefix).find(
      ([name]) => name.toLowerCase() === componentCounty.toLowerCase()
    );

    if (!floterialCounty || !componentCountyEntry) {
      throw new Error(`Unknown county in line: ${line}`);
    }

    return {
      floterialLabel: `${prefix}${Number(floterialDistrict)}`,
      floterialCounty: floterialCounty[0],
      floterialCountyCode: floterialCounty[1],
      floterialDistrict: Number(floterialDistrict),
      componentSldlCode: Number(sldlCode),
      componentCounty: componentCountyEntry[0],
      componentCountyCode: componentCountyEntry[1],
      componentDistrict: Number(componentDistrict),
      componentLabel: `${prefix}${Number(componentDistrict)}`,
    };
  });

const uniqueFloterials = [
  ...new Map(rows.map((row) => [`${row.floterialCountyCode}-${row.floterialDistrict}`, row])).values(),
];

const sql = `CREATE TABLE IF NOT EXISTS d1_floterial_components (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  floterial_label TEXT NOT NULL,
  floterial_county TEXT NOT NULL,
  floterial_county_code INTEGER NOT NULL,
  floterial_district INTEGER NOT NULL,
  component_sldl_code INTEGER NOT NULL,
  component_county TEXT NOT NULL,
  component_county_code INTEGER NOT NULL,
  component_district INTEGER NOT NULL,
  component_label TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(floterial_label, component_sldl_code)
);

CREATE INDEX IF NOT EXISTS idx_d1_floterial_components_component
ON d1_floterial_components(component_county_code, component_district);

CREATE INDEX IF NOT EXISTS idx_d1_floterial_components_floterial
ON d1_floterial_components(floterial_county_code, floterial_district);

DELETE FROM d1_floterial_components;

INSERT INTO d1_floterial_components (
  floterial_label,
  floterial_county,
  floterial_county_code,
  floterial_district,
  component_sldl_code,
  component_county,
  component_county_code,
  component_district,
  component_label
) VALUES
${rows
  .map(
    (row) =>
      `(${[
        sqlString(row.floterialLabel),
        sqlString(row.floterialCounty),
        row.floterialCountyCode,
        row.floterialDistrict,
        row.componentSldlCode,
        sqlString(row.componentCounty),
        row.componentCountyCode,
        row.componentDistrict,
        sqlString(row.componentLabel),
      ].join(", ")})`
  )
  .join(",\n")};

UPDATE d1_district_mapping
SET is_floterial_district = 0
WHERE body = 'H';

UPDATE d1_district_mapping
SET is_floterial_district = 1,
    updated_at = CURRENT_TIMESTAMP
WHERE body = 'H'
  AND (${uniqueFloterials
    .map(
      (row) =>
        `(county = ${row.floterialCountyCode} AND district = ${row.floterialDistrict})`
    )
    .join(" OR ")});
`;

mkdirSync(new URL("../tmp/floterial_import/", import.meta.url), {
  recursive: true,
});
writeFileSync(new URL("../tmp/floterial_import/floterial-components.sql", import.meta.url), sql);
console.log(`Wrote ${rows.length} component rows and ${uniqueFloterials.length} floterial districts.`);
