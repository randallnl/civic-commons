-- Reconcile current State House and State Senate search visibility against the
-- Secretary of State candidate list dated 2026-09-17 (audited 2026-10-12).
--
-- The shared candidate search requires both an active 2026 role and the
-- person-level is_2026_candidate flag. Restore the four Sullivan District 8
-- roles omitted by the prior page-boundary audit, repair flags on matched
-- active roles, and archive the one non-Daniel-Veilleux role absent from the
-- official list. Street addresses from the source PDF are not stored.

WITH official_roles(role_id) AS (
  VALUES (607), (608), (959), (250)
)
UPDATE d1_person_candidate_roles
SET status = 'active',
    source = '2026-general-candidate-list-2026-10-12',
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (SELECT role_id FROM official_roles)
  AND election_year = 2026
  AND office = 'State Representative';

-- Dallas Emery's NHLA-derived write-in role is not present in the official
-- general-election candidate list. His lost-primary role remains preserved.
UPDATE d1_person_candidate_roles
SET status = 'archived',
    source = '2026-general-candidate-list-2026-10-12-audit',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 2753
  AND person_id = 1016
  AND election_year = 2026
  AND office = 'State Representative'
  AND county = 'Carroll'
  AND district = '5';

-- Recalculate the current-candidate label for every person with a 2026
-- legislative role. This fixes Jeff Kerr, Hal Rafter, JJ DeFeo, Ginna
-- Schonwald, and Will Hurley, and activates the restored Sullivan candidates.
UPDATE d1_people
SET is_2026_candidate = CASE WHEN EXISTS (
      SELECT 1
      FROM d1_person_candidate_roles active_role
      WHERE active_role.person_id = d1_people.id
        AND active_role.election_year = 2026
        AND active_role.status = 'active'
        AND active_role.office IN ('State Representative', 'State Senate', 'State Senator')
    ) THEN 1 ELSE 0 END,
    updated_at = CURRENT_TIMESTAMP
WHERE EXISTS (
  SELECT 1
  FROM d1_person_candidate_roles role_2026
  WHERE role_2026.person_id = d1_people.id
    AND role_2026.election_year = 2026
    AND role_2026.office IN ('State Representative', 'State Senate', 'State Senator')
);

-- Preserve the Secretary of State's full ballot name as a searchable alias.
UPDATE d1_people
SET name_aliases = CASE
      WHEN trim(COALESCE(name_aliases, '')) = '' THEN 'Jonathan F. Stone'
      WHEN instr(lower(name_aliases), 'jonathan f. stone') = 0
        THEN name_aliases || ', Jonathan F. Stone'
      ELSE name_aliases
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 619;

UPDATE d1_people
SET name_aliases = CASE
      WHEN trim(COALESCE(name_aliases, '')) = '' THEN 'Jim Gruber'
      WHEN instr(lower(name_aliases), 'jim gruber') = 0
        THEN name_aliases || ', Jim Gruber'
      ELSE name_aliases
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 721;

PRAGMA optimize;
