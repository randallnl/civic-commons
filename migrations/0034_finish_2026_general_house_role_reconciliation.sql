-- Finish the one-to-one reconciliation against the Secretary of State
-- 2026-09-17 general-election candidate list.
--
-- These are duplicate or stale active roles whose PDF identity is already
-- represented by another canonical active role. Both Daniel Veilleux roles
-- (271 and 1468) are intentionally preserved at the user's direction.

WITH duplicate_roles(role_id) AS (
  VALUES
    (696), (25), (351), (195), (730), (738), (203), (108), (245),
    (404), (112), (114), (796), (448), (182), (824), (492), (233),
    (521), (523), (527), (148), (927), (222), (20), (575), (586)
)
UPDATE d1_person_candidate_roles
SET status = 'archived',
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (SELECT role_id FROM duplicate_roles)
  AND election_year = 2026
  AND office = 'State Representative'
  AND status = 'active'
  AND id NOT IN (271, 1468);

-- Robert Jones is listed as Bob Jones in Hillsborough District 44. Restore
-- the role archived by the first pass and record the nickname for future
-- reconciliations.
UPDATE d1_person_candidate_roles
SET status = 'active',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 493
  AND person_id = 826
  AND election_year = 2026;

UPDATE d1_people
SET name_aliases = CASE
      WHEN id = 826 AND instr(lower(COALESCE(name_aliases, '')), 'bob jones') = 0
        THEN CASE WHEN COALESCE(name_aliases, '') = '' THEN 'Bob Jones'
                  ELSE name_aliases || ', Bob Jones' END
      ELSE name_aliases
    END,
    is_2026_candidate = CASE WHEN EXISTS (
      SELECT 1
      FROM d1_person_candidate_roles active_role
      WHERE active_role.person_id = d1_people.id
        AND active_role.election_year = 2026
        AND active_role.status = 'active'
    ) THEN 1 ELSE 0 END,
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (
  170, 438, 709, 573, 216, 1030, 179, 510, 614, 754, 513, 514, 381,
  791, 562, 1095, 825, 606, 850, 852, 856, 538, 108, 595, 434, 892,
  897, 826
);
