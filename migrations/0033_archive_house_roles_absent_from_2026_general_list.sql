-- Archive active 2026 State Representative roles that are absent from the
-- Secretary of State candidate list dated 2026-09-17.
--
-- Daniel Veilleux is intentionally preserved at the user's direction. The
-- two active Daniel Veilleux roles (IDs 271 and 1468) are not targets here.
-- Matthew Santonastaso (role 738) and Brian Seaworth (role 233) are also
-- preserved because the PDF lists those identities under fuller names.

WITH target_roles(role_id) AS (
  VALUES
    (337), (720), (723), (735), (230), (758), (759), (39), (453),
    (2624), (478), (477), (493), (840), (886), (882), (884), (888),
    (902), (911), (1507), (1481), (959), (607), (250), (608)
)
UPDATE d1_person_candidate_roles
SET status = 'archived',
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (SELECT role_id FROM target_roles)
  AND election_year = 2026
  AND office = 'State Representative'
  AND status = 'active'
  AND person_id NOT IN (188, 1702);

UPDATE d1_people
SET is_2026_candidate = CASE WHEN EXISTS (
      SELECT 1
      FROM d1_person_candidate_roles active_role
      WHERE active_role.person_id = d1_people.id
        AND active_role.election_year = 2026
        AND active_role.status = 'active'
    ) THEN 1 ELSE 0 END,
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (
  695, 175, 368, 1028, 603, 1048, 1049, 452, 793, 2534, 815, 814,
  826, 387, 46, 1143, 1144, 156, 1149, 1154, 1741, 1715, 1187, 318,
  619, 912
);
