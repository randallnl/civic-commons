-- Keep Daniel Veilleux's canonical, finance-linked 2026 candidacy (role 271)
-- and archive the redundant synthetic SOS import role (role 1468).

UPDATE d1_person_candidate_roles
SET status = 'archived',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1468
  AND person_id = 188
  AND filer_entity_number = 'sos-2026-house-hillsborough-34-daniel-t-veilleux'
  AND election_year = 2026
  AND status = 'active';

UPDATE d1_people
SET is_2026_candidate = CASE WHEN EXISTS (
      SELECT 1
      FROM d1_person_candidate_roles active_role
      WHERE active_role.person_id = d1_people.id
        AND active_role.election_year = 2026
        AND active_role.status = 'active'
    ) THEN 1 ELSE 0 END,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 188;

PRAGMA optimize;
