export function candidateRoleVisibilitySql({ includeInactive = false } = {}) {
  return includeInactive
    ? {
        joinCondition: "",
        personWhere: "(cr.id IS NOT NULL OR p.filer_entity_number IS NOT NULL)",
      }
    : {
        joinCondition: "AND cr.election_year = 2026 AND cr.status = 'active'",
        personWhere: `p.is_2026_candidate = 1
          AND (cr.id IS NOT NULL OR NOT EXISTS (
            SELECT 1 FROM d1_person_candidate_roles existing_role
            WHERE existing_role.person_id = p.id
              AND existing_role.election_year = 2026
          ))`,
      };
}

export function isCurrentCandidateRecord(candidate) {
  if (!candidate || candidate.isCurrentCandidate === false) return false;
  if (candidate.electionYear && Number(candidate.electionYear) !== 2026) return false;
  return !candidate.candidacyStatus || candidate.candidacyStatus === "active";
}
