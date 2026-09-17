const COUNTY_BY_CODE = {
  1: "Belknap",
  2: "Carroll",
  3: "Cheshire",
  4: "Coos",
  5: "Grafton",
  6: "Hillsborough",
  7: "Merrimack",
  8: "Rockingham",
  9: "Strafford",
  10: "Sullivan",
};

export async function getFreeStateAlignedPeople(db) {
  if (!db) throw new Error("The people directory is unavailable.");

  const [peopleResult, districtsResult] = await Promise.all([
    db.prepare(`
      SELECT p.id, p.slug, p.display_name, p.name_aliases, p.party,
             COALESCE(NULLIF(p.photo_url, ''),
               (SELECT photo_url FROM d1_legislator_photos lp WHERE lp.employeeno = p.employeeno LIMIT 1),
               (SELECT photo_url FROM candidates c WHERE c.filer_entity_number = p.filer_entity_number LIMIT 1),
               '') AS photo_url,
             p.updated_at, p.online_testimony_alignment_pct,
             p.is_current_legislator, p.is_2026_candidate,
             lr.id AS legislator_role_id, lr.legislativebody,
             lr.countycode, lr.district AS legislator_district,
             lr.towns_represented AS legislator_towns,
             cr.id AS candidate_role_id, cr.office AS candidate_office,
             cr.county AS candidate_county, cr.district AS candidate_district,
             cr.political_party AS candidate_party
      FROM d1_people p
      LEFT JOIN d1_person_legislator_roles lr ON lr.id = (
        SELECT role.id FROM d1_person_legislator_roles role
        WHERE role.person_id = p.id AND role.active = 1 AND role.session_year = 2026
        ORDER BY role.id DESC LIMIT 1
      )
      LEFT JOIN d1_person_candidate_roles cr ON cr.id = (
        SELECT role.id FROM d1_person_candidate_roles role
        WHERE role.person_id = p.id AND role.status = 'active' AND role.election_year = 2026
        ORDER BY role.id DESC LIMIT 1
      )
      WHERE p.is_free_state_aligned_2026 = 1
      ORDER BY p.display_name COLLATE NOCASE, p.id
    `).all(),
    db.prepare(`
      SELECT body, county, district, district_label, communities_represented, counties_represented
      FROM d1_district_mapping
      WHERE body IN ('H', 'S')
    `).all(),
  ]);

  const districtByKey = new Map(
    (districtsResult.results || []).map((district) => [districtKey(district.body, district.county, district.district), district]),
  );

  return (peopleResult.results || []).map((person) => enrichPerson(person, districtByKey));
}

export function enrichPerson(person, districtByKey = new Map()) {
  const isCurrentLegislator = Number(person.is_current_legislator) === 1 && person.legislator_role_id != null;
  const isCurrentCandidate = Number(person.is_2026_candidate) === 1 && person.candidate_role_id != null;
  const legislatorBody = person.legislativebody === "S" ? "senate" : person.legislativebody === "H" ? "house" : "";
  const candidateBody = /senat(?:e|or)/i.test(person.candidate_office || "")
    ? "senate"
    : /representative|house|general court/i.test(person.candidate_office || "")
      ? "house"
      : "";
  const legislatorCounty = COUNTY_BY_CODE[Number(person.countycode)] || "";
  const candidateCounty = String(person.candidate_county || "").trim();
  const legislatorDistrict = isCurrentLegislator
    ? districtByKey.get(districtKey(person.legislativebody, person.countycode, person.legislator_district))
    : null;
  const candidateDistrict = isCurrentCandidate
    ? districtByKey.get(districtKey(candidateBody === "senate" ? "S" : "H", countyCode(candidateCounty), person.candidate_district))
    : null;

  const towns = uniqueParts([
    person.legislator_towns,
    legislatorDistrict?.communities_represented,
    candidateDistrict?.communities_represented,
  ]);
  const counties = uniqueParts([
    legislatorBody === "senate" && legislatorDistrict ? "" : legislatorCounty,
    legislatorDistrict?.counties_represented,
    candidateBody === "senate" && candidateDistrict ? "" : candidateCounty,
    candidateDistrict?.counties_represented,
  ]);
  const body = uniqueParts([isCurrentLegislator && legislatorBody, isCurrentCandidate && candidateBody]).join(" ");
  const party = String(person.candidate_party || person.party || "").trim();

  return {
    ...person,
    isCurrentLegislator,
    isCurrentCandidate,
    body,
    party,
    towns,
    counties,
    districtLabel: isCurrentLegislator
      ? legislatorBody === "senate"
        ? roleDistrict(legislatorBody, "", person.legislator_district)
        : legislatorDistrict?.district_label || roleDistrict(legislatorBody, legislatorCounty, person.legislator_district)
      : isCurrentCandidate
        ? roleDistrict(candidateBody, candidateCounty, person.candidate_district)
        : "",
    candidateDistrictLabel: isCurrentCandidate
      ? candidateBody === "senate"
        ? roleDistrict(candidateBody, "", person.candidate_district)
        : candidateDistrict?.district_label || roleDistrict(candidateBody, candidateCounty, person.candidate_district)
      : "",
  };
}

export function personRoleFilterValue(person) {
  return [
    person.isCurrentLegislator && "legislators",
    person.isCurrentCandidate && "candidates",
  ].filter(Boolean).join(" ") || "none";
}

export function hasValidAlignmentPercent(value) {
  return value != null && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100;
}

function districtKey(body, county, district) {
  const chamber = String(body || "").toUpperCase();
  return `${chamber}:${chamber === "S" ? "" : Number(county) || ""}:${Number(district) || ""}`;
}

function countyCode(county) {
  const match = Object.entries(COUNTY_BY_CODE).find(([, name]) => name.toLowerCase() === String(county || "").toLowerCase());
  return match?.[0] || "";
}

function roleDistrict(body, county, district) {
  const number = String(district || "").trim();
  if (!number) return "";
  return body === "senate" ? `Senate District ${number}` : [county, `District ${number}`].filter(Boolean).join(" ");
}

function uniqueParts(values) {
  return [...new Set(values.flatMap((value) => String(value || "").split(/[,;|]/)).map((value) => value.trim()).filter(Boolean))];
}
