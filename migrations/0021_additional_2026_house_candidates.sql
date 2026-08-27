-- Add 2026 State Representative candidates supplied from the registration list.
-- Street addresses are intentionally not stored in public profile data.

INSERT OR IGNORE INTO d1_people (
  filer_entity_number,
  firstname,
  middlename,
  lastname,
  display_name,
  slug,
  party,
  is_2026_candidate,
  name_aliases,
  source,
  updated_at
)
VALUES
  (
    'sos-2026-house-coos-4-scott-mckinnon-black',
    'Scott',
    'McKinnon',
    'Black',
    'Scott McKinnon Black',
    'sos-2026-house-coos-4-scott-mckinnon-black',
    'Independent',
    1,
    'Scott Black, Scott McKinnon Black',
    'manual-candidate-registration-2026-08-26',
    CURRENT_TIMESTAMP
  ),
  (
    'sos-2026-house-hillsborough-13-c-mark-delsesto',
    'C.',
    'Mark',
    'DelSesto',
    'C. Mark DelSesto',
    'sos-2026-house-hillsborough-13-c-mark-delsesto',
    'Independent',
    1,
    'C Mark DelSesto, Mark DelSesto',
    'manual-candidate-registration-2026-08-26',
    CURRENT_TIMESTAMP
  ),
  (
    'sos-2026-house-merrimack-13-becky-berk',
    'Becky',
    NULL,
    'Berk',
    'Becky Berk',
    'sos-2026-house-merrimack-13-becky-berk',
    'Independent',
    1,
    NULL,
    'manual-candidate-registration-2026-08-26',
    CURRENT_TIMESTAMP
  ),
  (
    'sos-2026-house-merrimack-13-paul-twomey',
    'Paul',
    NULL,
    'Twomey',
    'Paul Twomey',
    'sos-2026-house-merrimack-13-paul-twomey',
    'Independent',
    1,
    NULL,
    'manual-candidate-registration-2026-08-26',
    CURRENT_TIMESTAMP
  ),
  (
    'sos-2026-house-rockingham-23-kirsten-larsen-schultz',
    'Kirsten',
    'Larsen',
    'Schultz',
    'Kirsten Larsen Schultz',
    'sos-2026-house-rockingham-23-kirsten-larsen-schultz',
    'Independent',
    1,
    'Kirsten Schultz, Kirsten Larsen Schultz',
    'manual-candidate-registration-2026-08-26',
    CURRENT_TIMESTAMP
  ),
  (
    'sos-2026-house-rockingham-32-kaley-dvorak',
    'Kaley',
    NULL,
    'Dvorak',
    'Kaley Dvorak',
    'sos-2026-house-rockingham-32-kaley-dvorak',
    'Undeclared',
    1,
    NULL,
    'manual-candidate-registration-2026-08-26',
    CURRENT_TIMESTAMP
  );

UPDATE d1_people
SET party = 'Classic Liberal',
    is_2026_candidate = 1,
    name_aliases = CASE
      WHEN COALESCE(name_aliases, '') = '' THEN 'Daryl D''Angelo, Daryl D’Angelo'
      WHEN instr(name_aliases, 'Daryl D’Angelo') > 0 THEN name_aliases
      ELSE name_aliases || ', Daryl D’Angelo'
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE filer_entity_number = '244314';

INSERT OR IGNORE INTO d1_person_candidate_roles (
  person_id,
  filer_entity_number,
  office_type,
  office,
  county,
  district,
  political_party,
  election_year,
  election_cycle,
  total_raised,
  total_spent,
  status,
  source,
  updated_at
)
SELECT
  id,
  'sos-2026-house-coos-4-scott-mckinnon-black',
  'General Court',
  'State Representative',
  'Coos',
  '4',
  'Independent',
  2026,
  '2026 Election Cycle',
  0,
  0,
  'active',
  'manual-candidate-registration-2026-08-26',
  CURRENT_TIMESTAMP
FROM d1_people
WHERE filer_entity_number = 'sos-2026-house-coos-4-scott-mckinnon-black';

INSERT OR IGNORE INTO d1_person_candidate_roles (
  person_id, filer_entity_number, office_type, office, county, district,
  political_party, election_year, election_cycle, total_raised, total_spent,
  status, source, updated_at
)
SELECT id, 'sos-2026-house-hillsborough-13-c-mark-delsesto', 'General Court',
  'State Representative', 'Hillsborough', '13', 'Independent', 2026,
  '2026 Election Cycle', 0, 0, 'active',
  'manual-candidate-registration-2026-08-26', CURRENT_TIMESTAMP
FROM d1_people
WHERE filer_entity_number = 'sos-2026-house-hillsborough-13-c-mark-delsesto';

INSERT OR IGNORE INTO d1_person_candidate_roles (
  person_id, filer_entity_number, office_type, office, county, district,
  political_party, election_year, election_cycle, total_raised, total_spent,
  status, source, updated_at
)
SELECT id, 'sos-2026-house-merrimack-13-becky-berk', 'General Court',
  'State Representative', 'Merrimack', '13', 'Independent', 2026,
  '2026 Election Cycle', 0, 0, 'active',
  'manual-candidate-registration-2026-08-26', CURRENT_TIMESTAMP
FROM d1_people
WHERE filer_entity_number = 'sos-2026-house-merrimack-13-becky-berk';

INSERT OR IGNORE INTO d1_person_candidate_roles (
  person_id, filer_entity_number, office_type, office, county, district,
  political_party, election_year, election_cycle, total_raised, total_spent,
  status, source, updated_at
)
SELECT id, 'sos-2026-house-merrimack-13-paul-twomey', 'General Court',
  'State Representative', 'Merrimack', '13', 'Independent', 2026,
  '2026 Election Cycle', 0, 0, 'active',
  'manual-candidate-registration-2026-08-26', CURRENT_TIMESTAMP
FROM d1_people
WHERE filer_entity_number = 'sos-2026-house-merrimack-13-paul-twomey';

INSERT OR IGNORE INTO d1_person_candidate_roles (
  person_id, filer_entity_number, office_type, office, county, district,
  political_party, election_year, election_cycle, total_raised, total_spent,
  status, source, updated_at
)
SELECT id, 'sos-2026-house-rockingham-23-kirsten-larsen-schultz', 'General Court',
  'State Representative', 'Rockingham', '23', 'Independent', 2026,
  '2026 Election Cycle', 0, 0, 'active',
  'manual-candidate-registration-2026-08-26', CURRENT_TIMESTAMP
FROM d1_people
WHERE filer_entity_number = 'sos-2026-house-rockingham-23-kirsten-larsen-schultz';

INSERT OR IGNORE INTO d1_person_candidate_roles (
  person_id, filer_entity_number, office_type, office, county, district,
  political_party, election_year, election_cycle, total_raised, total_spent,
  status, source, updated_at
)
SELECT id, 'sos-2026-house-rockingham-32-kaley-dvorak', 'General Court',
  'State Representative', 'Rockingham', '32', 'Undeclared', 2026,
  '2026 Election Cycle', 0, 0, 'active',
  'manual-candidate-registration-2026-08-26', CURRENT_TIMESTAMP
FROM d1_people
WHERE filer_entity_number = 'sos-2026-house-rockingham-32-kaley-dvorak';

INSERT OR IGNORE INTO d1_person_candidate_roles (
  person_id, filer_entity_number, office_type, office, county, district,
  political_party, election_year, election_cycle, total_raised, total_spent,
  status, source, updated_at
)
SELECT id, 'sos-2026-house-hillsborough-37-daryl-dangelo', 'General Court',
  'State Representative', 'Hillsborough', '37', 'Classic Liberal', 2026,
  '2026 Election Cycle', 0, 0, 'active',
  'manual-candidate-registration-2026-08-26', CURRENT_TIMESTAMP
FROM d1_people
WHERE filer_entity_number = '244314';
