ALTER TABLE d1_person_candidate_roles ADD COLUMN votes_received INTEGER;
ALTER TABLE d1_person_candidate_roles ADD COLUMN total_contest_votes INTEGER;
ALTER TABLE d1_person_candidate_roles ADD COLUMN winning_margin_votes INTEGER;
ALTER TABLE d1_person_candidate_roles ADD COLUMN seats_available INTEGER;
ALTER TABLE d1_person_candidate_roles ADD COLUMN election_result_source TEXT;

CREATE INDEX IF NOT EXISTS idx_d1_person_candidate_roles_election_results
ON d1_person_candidate_roles(person_id, election_year, status);

INSERT INTO d1_person_candidate_roles (
  person_id, filer_entity_number, office_type, office, county, district,
  political_party, election_year, election_cycle, status, source,
  votes_received, total_contest_votes, winning_margin_votes, seats_available,
  election_result_source, updated_at
)
SELECT id, 'nh-2024-ge-house-sullivan-1-brian-sullivan', 'General Court',
  'State Representative', 'Sullivan', '1', 'Democratic Party', 2024,
  '2024 General Election', 'elected', 'NH Secretary of State',
  1565, 2378, 754, 1, '2024-ge-house-sullivan_0.xlsx', CURRENT_TIMESTAMP
FROM d1_people WHERE slug = 'brian-sullivan'
ON CONFLICT(filer_entity_number, election_year) DO UPDATE SET
  person_id = excluded.person_id, votes_received = excluded.votes_received,
  total_contest_votes = excluded.total_contest_votes,
  winning_margin_votes = excluded.winning_margin_votes,
  seats_available = excluded.seats_available,
  election_result_source = excluded.election_result_source,
  status = excluded.status, source = excluded.source, updated_at = CURRENT_TIMESTAMP;

INSERT INTO d1_person_candidate_roles (
  person_id, filer_entity_number, office_type, office, county, district,
  political_party, election_year, election_cycle, status, source,
  votes_received, total_contest_votes, winning_margin_votes, seats_available,
  election_result_source, updated_at
)
SELECT id, 'nh-2024-ge-house-sullivan-2-william-palmer', 'General Court',
  'State Representative', 'Sullivan', '2', 'Democratic Party', 2024,
  '2024 General Election', 'elected', 'NH Secretary of State',
  1662, 2764, 560, 1, '2024-ge-house-sullivan_0.xlsx', CURRENT_TIMESTAMP
FROM d1_people WHERE slug = 'william-palmer'
ON CONFLICT(filer_entity_number, election_year) DO UPDATE SET
  person_id = excluded.person_id, votes_received = excluded.votes_received,
  total_contest_votes = excluded.total_contest_votes,
  winning_margin_votes = excluded.winning_margin_votes,
  seats_available = excluded.seats_available,
  election_result_source = excluded.election_result_source,
  status = excluded.status, source = excluded.source, updated_at = CURRENT_TIMESTAMP;

INSERT INTO d1_person_candidate_roles (
  person_id, filer_entity_number, office_type, office, county, district,
  political_party, election_year, election_cycle, status, source,
  votes_received, total_contest_votes, winning_margin_votes, seats_available,
  election_result_source, updated_at
)
SELECT id,
  'nh-2024-ge-house-sullivan-3-' || slug, 'General Court',
  'State Representative', 'Sullivan', '3',
  CASE slug
    WHEN 'skip-rollins' THEN 'Republican Party'
    WHEN 'steven-smith' THEN 'Republican Party'
    ELSE 'Republican Party'
  END,
  2024, '2024 General Election', 'elected', 'NH Secretary of State',
  CASE slug WHEN 'skip-rollins' THEN 3936 WHEN 'steven-smith' THEN 3508 ELSE 3130 END,
  13152,
  CASE slug WHEN 'skip-rollins' THEN 1370 WHEN 'steven-smith' THEN 942 ELSE 564 END,
  3, '2024-ge-house-sullivan_0.xlsx', CURRENT_TIMESTAMP
FROM d1_people WHERE slug IN ('skip-rollins', 'steven-smith', 'walter-spilsbury')
ON CONFLICT(filer_entity_number, election_year) DO UPDATE SET
  person_id = excluded.person_id, votes_received = excluded.votes_received,
  total_contest_votes = excluded.total_contest_votes,
  winning_margin_votes = excluded.winning_margin_votes,
  seats_available = excluded.seats_available,
  election_result_source = excluded.election_result_source,
  status = excluded.status, source = excluded.source, updated_at = CURRENT_TIMESTAMP;

INSERT INTO d1_person_candidate_roles (
  person_id, filer_entity_number, office_type, office, county, district,
  political_party, election_year, election_cycle, status, source,
  votes_received, total_contest_votes, winning_margin_votes, seats_available,
  election_result_source, updated_at
)
SELECT id, 'nh-2024-ge-house-sullivan-4-judy-aron', 'General Court',
  'State Representative', 'Sullivan', '4', 'Republican Party', 2024,
  '2024 General Election', 'elected', 'NH Secretary of State',
  1806, 2961, 652, 1, '2024-ge-house-sullivan_0.xlsx', CURRENT_TIMESTAMP
FROM d1_people WHERE slug = 'judy-aron-9429'
ON CONFLICT(filer_entity_number, election_year) DO UPDATE SET
  person_id = excluded.person_id, votes_received = excluded.votes_received,
  total_contest_votes = excluded.total_contest_votes,
  winning_margin_votes = excluded.winning_margin_votes,
  seats_available = excluded.seats_available,
  election_result_source = excluded.election_result_source,
  status = excluded.status, source = excluded.source, updated_at = CURRENT_TIMESTAMP;

INSERT INTO d1_person_candidate_roles (
  person_id, filer_entity_number, office_type, office, county, district,
  political_party, election_year, election_cycle, status, source,
  votes_received, total_contest_votes, winning_margin_votes, seats_available,
  election_result_source, updated_at
)
SELECT id, 'nh-2024-ge-house-sullivan-5-george-grant', 'General Court',
  'State Representative', 'Sullivan', '5', 'Republican Party', 2024,
  '2024 General Election', 'elected', 'NH Secretary of State',
  1686, 3360, 16, 1, '2024-ge-house-sullivan_0.xlsx', CURRENT_TIMESTAMP
FROM d1_people WHERE slug = 'george-grant'
ON CONFLICT(filer_entity_number, election_year) DO UPDATE SET
  person_id = excluded.person_id, votes_received = excluded.votes_received,
  total_contest_votes = excluded.total_contest_votes,
  winning_margin_votes = excluded.winning_margin_votes,
  seats_available = excluded.seats_available,
  election_result_source = excluded.election_result_source,
  status = excluded.status, source = excluded.source, updated_at = CURRENT_TIMESTAMP;

INSERT INTO d1_person_candidate_roles (
  person_id, filer_entity_number, office_type, office, county, district,
  political_party, election_year, election_cycle, status, source,
  votes_received, total_contest_votes, winning_margin_votes, seats_available,
  election_result_source, updated_at
)
SELECT id,
  'nh-2024-ge-house-sullivan-6-' || slug, 'General Court',
  'State Representative', 'Sullivan', '6',
  CASE WHEN slug IN ('john-cloutier', 'dale-girard-11293')
    THEN 'Democratic Party' ELSE 'Republican Party' END,
  2024, '2024 General Election', 'elected', 'NH Secretary of State',
  CASE slug WHEN 'dale-girard-11293' THEN 2895 WHEN 'john-cloutier' THEN 2804 ELSE 2783 END,
  16158,
  CASE slug WHEN 'dale-girard-11293' THEN 256 WHEN 'john-cloutier' THEN 165 ELSE 144 END,
  3, '2024-ge-house-sullivan_0.xlsx', CURRENT_TIMESTAMP
FROM d1_people WHERE slug IN ('dale-girard-11293', 'john-cloutier', 'wayne-hemingway')
ON CONFLICT(filer_entity_number, election_year) DO UPDATE SET
  person_id = excluded.person_id, votes_received = excluded.votes_received,
  total_contest_votes = excluded.total_contest_votes,
  winning_margin_votes = excluded.winning_margin_votes,
  seats_available = excluded.seats_available,
  election_result_source = excluded.election_result_source,
  status = excluded.status, source = excluded.source, updated_at = CURRENT_TIMESTAMP;

INSERT INTO d1_person_candidate_roles (
  person_id, filer_entity_number, office_type, office, county, district,
  political_party, election_year, election_cycle, status, source,
  votes_received, total_contest_votes, winning_margin_votes, seats_available,
  election_result_source, updated_at
)
SELECT id, 'nh-2024-ge-house-sullivan-7-margaret-drye', 'General Court',
  'State Representative', 'Sullivan', '7', 'Republican Party', 2024,
  '2024 General Election', 'elected', 'NH Secretary of State',
  4904, 9143, 668, 1, '2024-ge-house-sullivan_0.xlsx', CURRENT_TIMESTAMP
FROM d1_people WHERE slug = 'margaret-drye'
ON CONFLICT(filer_entity_number, election_year) DO UPDATE SET
  person_id = excluded.person_id, votes_received = excluded.votes_received,
  total_contest_votes = excluded.total_contest_votes,
  winning_margin_votes = excluded.winning_margin_votes,
  seats_available = excluded.seats_available,
  election_result_source = excluded.election_result_source,
  status = excluded.status, source = excluded.source, updated_at = CURRENT_TIMESTAMP;

INSERT INTO d1_person_candidate_roles (
  person_id, filer_entity_number, office_type, office, county, district,
  political_party, election_year, election_cycle, status, source,
  votes_received, total_contest_votes, winning_margin_votes, seats_available,
  election_result_source, updated_at
)
SELECT id,
  'nh-2024-ge-house-sullivan-8-' || slug, 'General Court',
  'State Representative', 'Sullivan', '8',
  CASE WHEN slug = 'hope-damon' THEN 'Democratic Party' ELSE 'Republican Party' END,
  2024, '2024 General Election', 'elected', 'NH Secretary of State',
  CASE WHEN slug = 'hope-damon' THEN 5992 ELSE 5744 END,
  22673,
  CASE WHEN slug = 'hope-damon' THEN 411 ELSE 163 END,
  2, '2024-ge-house-sullivan_0.xlsx', CURRENT_TIMESTAMP
FROM d1_people WHERE slug IN ('hope-damon', 'michael-aron-11442')
ON CONFLICT(filer_entity_number, election_year) DO UPDATE SET
  person_id = excluded.person_id, votes_received = excluded.votes_received,
  total_contest_votes = excluded.total_contest_votes,
  winning_margin_votes = excluded.winning_margin_votes,
  seats_available = excluded.seats_available,
  election_result_source = excluded.election_result_source,
  status = excluded.status, source = excluded.source, updated_at = CURRENT_TIMESTAMP;
