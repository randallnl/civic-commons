#!/usr/bin/env python3
"""Build the 2026 profile campaign-finance import from an NH SOS CSV export."""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import re
import subprocess
import unicodedata
from collections import defaultdict
from pathlib import Path


CYCLE_START = dt.date(2024, 11, 6)
ELECTION_YEAR = 2026
SOURCE_URL = "https://cfs.sos.nh.gov/public/cf/reports"

# Committee IDs are stable within the source export. These overrides cover names
# that cannot be resolved safely from the committee label alone.
EXPLICIT_COMMITTEE_PEOPLE = {
    "242096": "Pat Long",
    "57310": "Denise Ricciardi",
    "244466": "Rob Lovett",
    "242261": "Wendy Larson",
    "243726": "Paul Goundrey",
    "243745": "Michael Pellerito",
    "242061": "Emily Phillips",
    "244276": "Lisa Beaudoin",
    "242179": "James Thibault",
    "244360": "Timothy Fitzpatrick",
    "242239": "Jenny Ramsey",
    "244555": "Kurt Wuelper",
    "242105": "Matt Sabourin dit Choiniere",
    "241977": "Ed Friedrich",
    "244338": "JJ DeFeo",
    "244257": "Allan Frank",
    "244281": "Nathan Giffard",
    "243733": "Jonathan King",
    "243635": "Kristopher Levesque",
    "242623": "Mark Paige",
    # Clear committee-name aliases found during review.
    "244534": "Robert Jones",
    "242125": "David Trumble",
    "179817": "Sherman Packard",
    "242106": "Eleana Colby",
    "243721": "Ty Wyman",
    "242090": "Alice Wade",
    "244383": "Alison Murphy",
    "244632": "Myles England",
    "244574": "Paige C. Dunleavy",
    "244507": "Robert Richard-Snipes",
    "242050": "Jim Creighton",
    "243686": "Dean Cascadden",
    "243730": "Ted Trost",
    "244202": "Tom Trost",
    "242100": "Terry Spahr",
    "244452": "Andy Dow",
    "244401": "Jim Kelly",
}

STOP_WORDS = {
    "candidate", "campaign", "citizens", "committee", "district", "elect",
    "election", "for", "friend", "friends", "hampshire", "new", "nh", "of",
    "pac", "people", "rep", "representative", "senate", "senator", "state",
    "the", "to", "vote", "ward",
}
NAME_SUFFIXES = {"ii", "iii", "iv", "jr", "sr"}
TOTAL_RECEIPT_SUBTYPES = {
    "Interest", "Interest Earned", "Itemized Monetary",
    "Itemized Monetary Contribution", "Monetary Contribution", "Unitemized Monetary",
}
CONTRIBUTOR_RECEIPT_SUBTYPES = {
    "Itemized Monetary", "Itemized Monetary Contribution", "Monetary Contribution",
}
NON_DISPLAY_CONTRIBUTORS = {
    "anonymous", "name withheld", "under threshold name withheld", "unitemized",
    "unitemized contributions",
}


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(char for char in value if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def compact(value: str) -> str:
    return normalize(value).replace(" ", "")


def name_tokens(value: str) -> list[str]:
    return [
        token for token in normalize(value).split()
        if token not in NAME_SUFFIXES and len(token) > 1
    ]


def committee_tokens(value: str) -> set[str]:
    return {
        token for token in normalize(value).split()
        if token not in STOP_WORDS and not token.isdigit()
    }


def money(value: str) -> float:
    try:
        return float((value or "0").replace("$", "").replace(",", "").strip())
    except ValueError:
        return 0.0


def parse_date(value: str) -> dt.date | None:
    try:
        return dt.datetime.strptime((value or "").strip(), "%m/%d/%Y").date()
    except ValueError:
        return None


def sql_text(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def fetch_candidates() -> list[dict]:
    sql = """
      SELECT cr.person_id, p.display_name, COALESCE(p.name_aliases, '') AS name_aliases,
             cr.filer_entity_number, cr.office, cr.county, cr.district
      FROM d1_person_candidate_roles cr
      JOIN d1_people p ON p.id = cr.person_id
      WHERE cr.election_year = 2026
      ORDER BY p.display_name COLLATE NOCASE
    """
    command = [
        "wrangler", "d1", "execute", "nhdb", "--remote", "--json",
        "--command", sql,
    ]
    result = subprocess.run(command, check=True, capture_output=True, text=True)
    payload = json.loads(result.stdout)
    return payload[0]["results"]


def candidate_variants(candidate: dict) -> list[str]:
    variants = [candidate["display_name"]]
    variants.extend(
        item.strip() for item in (candidate.get("name_aliases") or "").split(",")
        if item.strip()
    )
    return variants


def resolve_candidates(committees: dict[str, str], candidates: list[dict]):
    by_exact_name: dict[str, list[dict]] = defaultdict(list)
    by_exact_display_name: dict[str, list[dict]] = defaultdict(list)
    by_filer: dict[str, list[dict]] = defaultdict(list)
    surname_counts: dict[str, int] = defaultdict(int)
    candidate_cores = []

    for candidate in candidates:
        by_filer[(candidate.get("filer_entity_number") or "").strip()].append(candidate)
        by_exact_display_name[normalize(candidate["display_name"])].append(candidate)
        for variant in candidate_variants(candidate):
            by_exact_name[normalize(variant)].append(candidate)
        core = name_tokens(candidate["display_name"])
        first = core[0] if core else ""
        last = core[-1] if core else ""
        if last:
            surname_counts[last] += 1
        candidate_cores.append((candidate, first, last))

    resolved: dict[str, dict] = {}
    unresolved: list[dict] = []

    for committee_id, committee_name in committees.items():
        filer_options = by_filer.get(committee_id, [])
        if len(filer_options) == 1:
            resolved[committee_id] = filer_options[0]
            continue

        explicit_name = EXPLICIT_COMMITTEE_PEOPLE.get(committee_id)
        if explicit_name:
            normalized_explicit = normalize(explicit_name)
            display_options = [
                candidate for candidate in candidates
                if normalize(candidate["display_name"]) == normalized_explicit
            ]
            options = display_options or by_exact_name.get(normalized_explicit, [])
            if len(options) == 1:
                resolved[committee_id] = options[0]
                continue
            unresolved.append({
                "committee_id": committee_id,
                "committee_name": committee_name,
                "reason": f"explicit person not uniquely found: {explicit_name}",
            })
            continue

        exact_options = by_exact_display_name.get(normalize(committee_name), [])
        if len(exact_options) != 1:
            exact_options = by_exact_name.get(normalize(committee_name), [])
        if len(exact_options) == 1:
            resolved[committee_id] = exact_options[0]
            continue

        c_compact = compact(committee_name)
        c_tokens = committee_tokens(committee_name)
        matches = []

        for candidate, first, last in candidate_cores:
            score = 0
            for variant in candidate_variants(candidate):
                tokens = name_tokens(variant)
                if len(tokens) < 2:
                    continue
                joined = "".join(tokens)
                if len(joined) >= 6 and joined in c_compact:
                    score = max(score, 120 + len(joined))
                if all(token in c_tokens for token in tokens):
                    score = max(score, 110 + len(joined))

            first_last = first + last
            if first and last and len(first_last) >= 6 and first_last in c_compact:
                score = max(score, 105 + len(first_last))
            if first and last and first in c_tokens and last in c_tokens:
                score = max(score, 100 + len(first_last))
            if last and len(last) >= 4 and last in c_tokens and surname_counts[last] == 1:
                score = max(score, 70 + len(last))
            if score:
                matches.append((score, candidate))

        matches.sort(key=lambda item: (-item[0], item[1]["display_name"].lower()))
        if matches and (len(matches) == 1 or matches[0][0] > matches[1][0]):
            resolved[committee_id] = matches[0][1]
        else:
            unresolved.append({
                "committee_id": committee_id,
                "committee_name": committee_name,
                "reason": "ambiguous" if matches else "no candidate match",
                "possibilities": [item[1]["display_name"] for item in matches[:4]],
            })

    return resolved, unresolved


def build_import(csv_path: Path, output_path: Path):
    candidates = fetch_candidates()
    rows = []
    committees: dict[str, str] = {}

    with csv_path.open(newline="", encoding="utf-8-sig") as source:
        first_line = source.readline()
        new_export = first_line.startswith("Contributions  Download as of")
        if not new_export:
            source.seek(0)
        for row in csv.DictReader(source):
            if new_export:
                committee_id = (row.get("Filer Entity Id") or "").strip()
                entity_name = (row.get("Entity Committee Name") or "").strip()
                if not entity_name:
                    entity_name = " ".join(
                        (row.get(field) or "").strip()
                        for field in ("Entity First Name", "Entity Middle Name", "Entity Last Name")
                        if (row.get(field) or "").strip()
                    )
                receipt_date = parse_date(row.get("Download Transaction Date") or "")
                normalized_row = {
                    **row,
                    "_committee_id": committee_id,
                    "_date": receipt_date,
                    "_transaction_type": (row.get("Transaction Type Desc") or "").strip(),
                    "_subtype": (row.get("Transaction Sub Type") or "").strip(),
                    "_amount": money(row.get("Download Transaction Amount") or ""),
                    "_contributor": (row.get("Source Name") or "").strip(),
                    "_contributor_type": (row.get("Transaction Source") or "").strip(),
                    "_city": (row.get("Source City") or "").strip(),
                    "_state": (row.get("Source State Code") or "").strip(),
                }
            else:
                if row.get("Committee Subtype") != "Candidate Committee":
                    continue
                committee_id = (row.get("Filing Entity ID") or "").strip()
                entity_name = (row.get("Committee Name") or "").strip()
                receipt_date = parse_date(row.get("Date of Receipt") or "")
                normalized_row = {
                    **row,
                    "_committee_id": committee_id,
                    "_date": receipt_date,
                    "_transaction_type": (row.get("Transaction Type") or "").strip(),
                    "_subtype": (row.get("Transaction Sub Type") or "").strip(),
                    "_amount": money(row.get("Amount of receipt") or ""),
                    "_contributor": (row.get("Contributor Name") or "").strip(),
                    "_contributor_type": (row.get("Contributor Type") or "").strip(),
                    "_city": (row.get("Contributor City") or "").strip(),
                    "_state": (row.get("Contributor State") or "").strip(),
                }
            if not committee_id or not receipt_date or receipt_date < CYCLE_START:
                continue
            committees[committee_id] = entity_name
            rows.append(normalized_row)

    resolved, unresolved = resolve_candidates(committees, candidates)
    totals: dict[int, float] = defaultdict(float)
    contribution_totals: dict[tuple[int, str], float] = defaultdict(float)
    contribution_meta: dict[tuple[int, str], dict] = {}
    mapped_committees: dict[int, set[str]] = defaultdict(set)
    candidate_by_person: dict[int, dict] = {}

    duplicate_rows_skipped = 0
    seen_named_transactions: set[tuple] = set()
    for row in rows:
        committee_id = row["_committee_id"]
        candidate = resolved.get(committee_id)
        if not candidate:
            continue
        person_id = int(candidate["person_id"])
        candidate_by_person[person_id] = candidate
        mapped_committees[person_id].add(committee_id)
        transaction_type = row["_transaction_type"]
        subtype = row["_subtype"]
        amount = row["_amount"]

        contributor = row["_contributor"]
        contributor_key = normalize(contributor)
        transaction_signature = (
            committee_id, contributor_key, row["_date"], round(amount, 2),
            transaction_type, subtype, normalize(row["_city"]), normalize(row["_state"]),
            normalize(row.get("Source Address Line1") or row.get("Contributor Address") or ""),
            money(row.get("Download Total Transaction To The Filer") or ""),
        )
        # Named rows that are byte-for-byte equivalent in the SOS download are
        # duplicate records. Withheld rows may represent separate donors and must
        # remain distinct even when their public fields are identical.
        if contributor_key and not contributor_key.startswith("under threshold"):
            if transaction_signature in seen_named_transactions:
                duplicate_rows_skipped += 1
                continue
            seen_named_transactions.add(transaction_signature)

        if transaction_type == "Receipt" and subtype in TOTAL_RECEIPT_SUBTYPES:
            totals[person_id] += amount
        elif transaction_type == "Return Receipt" and subtype in CONTRIBUTOR_RECEIPT_SUBTYPES:
            totals[person_id] -= amount

        if (
            not contributor
            or contributor_key in NON_DISPLAY_CONTRIBUTORS
            or contributor_key.startswith("under threshold")
            or subtype not in CONTRIBUTOR_RECEIPT_SUBTYPES
        ):
            continue
        if transaction_type == "Receipt":
            signed_amount = amount
        elif transaction_type == "Return Receipt":
            signed_amount = -amount
        else:
            continue

        key = (person_id, contributor_key)
        contribution_totals[key] += signed_amount
        old_meta = contribution_meta.get(key)
        if not old_meta or row["_date"] >= old_meta["date"]:
            contribution_meta[key] = {
                "name": contributor,
                "date": row["_date"],
                "type": row["_contributor_type"],
                "city": row["_city"],
                "state": row["_state"],
            }

    contributors_by_person: dict[int, list[tuple[float, dict]]] = defaultdict(list)
    for (person_id, contributor_key), amount in contribution_totals.items():
        if amount <= 0:
            continue
        contributors_by_person[person_id].append(
            (round(amount, 2), contribution_meta[(person_id, contributor_key)])
        )
    for person_id in contributors_by_person:
        contributors_by_person[person_id].sort(
            key=lambda item: (-item[0], item[1]["name"].lower())
        )

    people_ids = sorted(candidate_by_person)
    sql = [
        "-- Generated by scripts/build_campaign_finance_import.py",
        f"-- Source: {csv_path.name}; cycle start: {CYCLE_START.isoformat()}",
        "-- Total raised includes monetary, itemized, unitemized, and interest receipts,",
        "-- less returned monetary receipts. Loans and in-kind receipts are excluded.",
        f"-- Resolved committees: {len(resolved)} of {len(committees)}",
        f"-- Candidate profiles populated: {len(people_ids)}",
        "",
    ]
    if people_ids:
        sql.append(
            "DELETE FROM d1_candidate_contributions "
            f"WHERE election_year = {ELECTION_YEAR} AND person_id IN ({', '.join(map(str, people_ids))});"
        )
        sql.append("")

    for person_id in people_ids:
        candidate = candidate_by_person[person_id]
        filer = candidate["filer_entity_number"]
        total = round(totals.get(person_id, 0.0), 2)
        sql.extend([
            "UPDATE d1_person_candidate_roles",
            f"SET total_raised = {total:.2f}, updated_at = CURRENT_TIMESTAMP",
            f"WHERE person_id = {person_id} AND election_year = {ELECTION_YEAR};",
            "UPDATE candidates",
            f"SET total_raised = {total:.2f}",
            f"WHERE filer_entity_number = {sql_text(filer)};",
        ])

        source_ids = ",".join(sorted(mapped_committees[person_id], key=int))
        for amount, meta in contributors_by_person.get(person_id, []):
            sql.extend([
                "INSERT INTO d1_candidate_contributions (",
                "  person_id, filer_entity_number, election_year, contributor_name, amount,",
                "  contribution_date, contributor_type, contributor_city, contributor_state,",
                "  source_filing_id, source_url, source, updated_at",
                ") VALUES (",
                f"  {person_id}, {sql_text(filer)}, {ELECTION_YEAR}, {sql_text(meta['name'])}, {amount:.2f},",
                f"  {sql_text(meta['date'].isoformat())}, {sql_text(meta['type'])}, {sql_text(meta['city'])}, {sql_text(meta['state'])},",
                f"  {sql_text(source_ids)}, {sql_text(SOURCE_URL)}, {sql_text('NH Secretary of State campaign finance CSV (' + csv_path.name + ')')}, CURRENT_TIMESTAMP",
                ");",
            ])
        sql.append("")

    output_path.write_text("\n".join(sql).rstrip() + "\n", encoding="utf-8")
    return {
        "source_rows_in_cycle": len(rows),
        "candidate_committees": len(committees),
        "resolved_committees": len(resolved),
        "profiles_populated": len(people_ids),
        "contributor_rows": sum(len(items) for items in contributors_by_person.values()),
        "duplicate_named_rows_skipped": duplicate_rows_skipped,
        "unresolved": unresolved,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("csv_path", type=Path)
    parser.add_argument("output_path", type=Path)
    args = parser.parse_args()
    audit = build_import(args.csv_path, args.output_path)
    print(json.dumps(audit, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
