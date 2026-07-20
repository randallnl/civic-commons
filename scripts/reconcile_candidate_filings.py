#!/usr/bin/env python3
import argparse
import json
import re
import sqlite3
import sys
from dataclasses import dataclass
from pathlib import Path

import pdfplumber


COUNTIES = {
    "Belknap",
    "Carroll",
    "Cheshire",
    "Coos",
    "Grafton",
    "Hillsborough",
    "Merrimack",
    "Rockingham",
    "Strafford",
    "Sullivan",
}

OFFICES = {"State Representative", "State Senate"}
PDF_OFFICE_LABELS = {
    "State Representative": "State Representative",
    "State Senator": "State Senate",
}
NON_TARGET_OFFICES = {
    "Governor",
    "United States Senator",
    "Representative in Congress",
    "Executive Councilor",
    "County Attorney",
    "County Treasurer",
    "Register of Deeds",
    "Register of Probate",
    "Sheriff",
    "County Commissioner",
    "Delegate to the Republican State Convention",
}
PARTY_BY_SECTION = {
    "DEMOCRATIC CUMULATIVE FILING": "Democratic Party",
    "REPUBLICAN CUMULATIVE FILING": "Republican Party",
}
PARTY_BY_CODE = {"DEM": "Democratic Party", "REP": "Republican Party"}


@dataclass(frozen=True)
class Candidate:
    name: str
    first: str
    last: str
    party: str
    office: str
    county: str
    district: str
    filer: str
    slug: str


def clean(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_name(value):
    value = clean(value).lower()
    value = value.replace("’", "'").replace("`", "'")
    value = re.sub(r"\b(jr|sr|ii|iii|iv)\b\.?", "", value)
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return clean(value)


def split_name(name):
    parts = clean(name).replace(",", "").split()
    if not parts:
        return "", ""
    suffixes = {"jr", "sr", "ii", "iii", "iv"}
    while parts and parts[-1].lower().rstrip(".") in suffixes:
        parts.pop()
    if not parts:
        return "", ""
    return parts[0], parts[-1]


def slugify(name):
    slug = normalize_name(name).replace(" ", "-")
    return slug or "candidate"


def synthetic_filer(candidate):
    county = clean(candidate.county).lower() or "state"
    office = "senate" if candidate.office == "State Senate" else "house"
    district = clean(candidate.district).lower() or "district"
    name = slugify(candidate.name)
    return f"sos-2026-{office}-{county}-{district}-{name}"


def candidate_key(row):
    county = "" if row.office == "State Senate" else clean(row.county).lower()
    return (
        normalize_name(row.name),
        row.office.lower(),
        county,
        clean(row.district).lower(),
        row.party.lower(),
    )


def candidate_identity_key(row):
    county = "" if row.office == "State Senate" else clean(row.county).lower()
    return (
        normalize_name(row.first),
        normalize_name(row.last),
        row.office.lower(),
        county,
        clean(row.district).lower(),
        row.party.lower(),
    )


def d1_key(row):
    name = row.get("display_name") or f"{row.get('firstname') or ''} {row.get('lastname') or ''}"
    office = clean(row.get("office"))
    county = "" if office == "State Senate" else clean(row.get("county")).lower()
    return (
        normalize_name(name),
        office.lower(),
        county,
        clean(row.get("district")).lower(),
        clean(row.get("political_party")).lower(),
    )


def d1_identity_key(row):
    first = row.get("firstname") or ""
    last = row.get("lastname") or ""
    if not first or not last:
        first, last = split_name(row.get("display_name") or "")
    office = clean(row.get("office"))
    county = "" if office == "State Senate" else clean(row.get("county")).lower()
    return (
        normalize_name(first),
        normalize_name(last),
        office.lower(),
        county,
        clean(row.get("district")).lower(),
        clean(row.get("political_party")).lower(),
    )


def extract_pdf_candidates(pdf_path):
    rows = []
    last_candidate_index = None
    last_candidate_context = None
    current_party = ""
    current_office = ""
    current_county = ""
    current_district = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            words = page.extract_words(x_tolerance=1, y_tolerance=3)
            line_groups = {}
            for word in words:
                top = round(float(word["top"]), 1)
                line_groups.setdefault(top, []).append(word)
            for _, line_words in sorted(line_groups.items()):
                line_words = sorted(line_words, key=lambda word: float(word["x0"]))
                line = clean(" ".join(word["text"] for word in line_words))
                if not line or line.startswith("Printed on") or line.startswith("Candidate Name "):
                    continue
                for marker, party in PARTY_BY_SECTION.items():
                    if marker in line:
                        party_changed = current_party and current_party != party
                        current_party = party
                        if party_changed:
                            current_office = ""
                            current_county = ""
                            current_district = ""
                if line in PDF_OFFICE_LABELS:
                    current_office = PDF_OFFICE_LABELS[line]
                    current_county = ""
                    current_district = ""
                    last_candidate_index = None
                    last_candidate_context = None
                    continue
                if line in NON_TARGET_OFFICES:
                    current_office = ""
                    current_county = ""
                    current_district = ""
                    last_candidate_index = None
                    last_candidate_context = None
                    continue
                county_match = re.fullmatch(r"([A-Za-z]+)\s+County", line, flags=re.IGNORECASE)
                if current_office == "State Representative" and county_match:
                    county_name = county_match.group(1).title()
                    if county_name == "Coos":
                        county_name = "Coos"
                    current_county = county_name
                    current_district = ""
                    last_candidate_index = None
                    last_candidate_context = None
                    continue
                district_match = re.fullmatch(r"District\s+(\d+)", line)
                if district_match and current_office in OFFICES:
                    current_district = district_match.group(1)
                    if current_office == "State Senate":
                        current_county = ""
                    last_candidate_index = None
                    last_candidate_context = None
                    continue
                if current_office not in OFFICES or not current_party:
                    continue
                if current_office == "State Representative" and not current_county:
                    continue
                if not current_district:
                    continue
                code = "DEM" if current_party.startswith("Democratic") else "REP"
                has_party_code = any(word["text"] == code and float(word["x0"]) >= 680 for word in line_words)
                if not has_party_code:
                    is_name_continuation = (
                        last_candidate_index is not None
                        and last_candidate_context == (current_party, current_office, current_county, current_district)
                        and line
                        and all(float(word["x0"]) < 188 for word in line_words)
                        and not line.isdigit()
                    )
                    if is_name_continuation:
                        previous = rows[last_candidate_index]
                        name = clean(f"{previous.name} {line}")
                        first, last = split_name(name)
                        updated = Candidate(
                            name=name,
                            first=first,
                            last=last,
                            party=previous.party,
                            office=previous.office,
                            county=previous.county,
                            district=previous.district,
                            filer="",
                            slug="",
                        )
                        filer = synthetic_filer(updated)
                        rows[last_candidate_index] = Candidate(
                            name=updated.name,
                            first=updated.first,
                            last=updated.last,
                            party=updated.party,
                            office=updated.office,
                            county=updated.county,
                            district=updated.district,
                            filer=filer,
                            slug=filer,
                        )
                    continue
                name_part = " ".join(word["text"] for word in line_words if float(word["x0"]) < 188)
                name = clean(name_part)
                if not name or name in OFFICES or name in COUNTIES:
                    continue
                first, last = split_name(name)
                candidate = Candidate(
                    name=name,
                    first=first,
                    last=last,
                    party=current_party,
                    office=current_office,
                    county=current_county,
                    district=current_district,
                    filer="",
                    slug="",
                )
                filer = synthetic_filer(candidate)
                rows.append(
                    Candidate(
                        name=candidate.name,
                        first=candidate.first,
                        last=candidate.last,
                        party=candidate.party,
                        office=candidate.office,
                        county=candidate.county,
                        district=candidate.district,
                        filer=filer,
                        slug=filer,
                    )
                )
                last_candidate_index = len(rows) - 1
                last_candidate_context = (current_party, current_office, current_county, current_district)
    seen = set()
    unique = []
    for row in rows:
        key = candidate_key(row)
        if key in seen:
            continue
        seen.add(key)
        unique.append(row)
    return unique


def load_d1_rows(path):
    data = json.loads(Path(path).read_text())
    if isinstance(data, list) and data and "results" in data[0]:
        return data[0]["results"]
    if isinstance(data, dict) and "results" in data:
        return data["results"]
    return data


def sql_quote(value):
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def render_sql(candidates):
    statements = []
    for c in candidates:
        name = clean(c.name)
        statements.append(
            "INSERT OR IGNORE INTO d1_people (filer_entity_number, firstname, lastname, display_name, slug, party, is_2026_candidate, source, updated_at) "
            f"VALUES ({sql_quote(c.filer)}, {sql_quote(c.first)}, {sql_quote(c.last)}, {sql_quote(name)}, {sql_quote(c.slug)}, {sql_quote(c.party)}, 1, 'sos-cumulative-filings-2026-06-29', CURRENT_TIMESTAMP);"
        )
        statements.append(
            "INSERT OR IGNORE INTO d1_person_candidate_roles (person_id, filer_entity_number, office_type, office, county, district, political_party, election_year, election_cycle, total_raised, total_spent, status, source, updated_at) "
            "SELECT id, "
            f"{sql_quote(c.filer)}, 'General Court', {sql_quote(c.office)}, {sql_quote(c.county)}, {sql_quote(c.district)}, {sql_quote(c.party)}, 2026, '2026 Election Cycle', 0, 0, 'active', 'sos-cumulative-filings-2026-06-29', CURRENT_TIMESTAMP "
            "FROM d1_people "
            f"WHERE filer_entity_number = {sql_quote(c.filer)};"
        )
    return "\n".join(statements) + "\n"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True)
    parser.add_argument("--d1-json", required=True)
    parser.add_argument("--sql-out", required=True)
    parser.add_argument("--report-out", required=True)
    args = parser.parse_args()

    pdf_candidates = extract_pdf_candidates(args.pdf)
    d1_rows = load_d1_rows(args.d1_json)
    existing_keys = {d1_key(row) for row in d1_rows}
    existing_identity_keys = {d1_identity_key(row) for row in d1_rows}
    missing = [
        row
        for row in pdf_candidates
        if candidate_key(row) not in existing_keys
        and candidate_identity_key(row) not in existing_identity_keys
    ]

    Path(args.sql_out).write_text(render_sql(missing))
    lines = [
        "# Missing 2026 General Court Candidates From SOS PDF",
        "",
        f"PDF candidates parsed: {len(pdf_candidates)}",
        f"Existing D1 State Rep/Senate candidate role rows: {len(d1_rows)}",
        f"Missing candidates to insert: {len(missing)}",
        "",
    ]
    by_office = {}
    for row in missing:
        by_office[row.office] = by_office.get(row.office, 0) + 1
    for office, count in sorted(by_office.items()):
        lines.append(f"- {office}: {count}")
    lines.append("")
    for row in missing:
        district = f"{row.county} District {row.district}" if row.county else f"District {row.district}"
        lines.append(f"- {row.name} - {row.party} - {row.office} - {district} - `{row.filer}`")
    Path(args.report_out).write_text("\n".join(lines) + "\n")
    print(f"parsed={len(pdf_candidates)} existing={len(d1_rows)} missing={len(missing)}")


if __name__ == "__main__":
    sys.exit(main())
