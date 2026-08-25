WITH election_results (
  district, person_slug, political_party, votes_received,
  total_contest_votes, winning_margin_votes
) AS (
  VALUES
    (1, 'david-rochefort-11458', 'Republican Party', 17613, 30996, 4242),
    (2, 'timothy-lang', 'Republican Party', 20117, 34517, 5745),
    (3, 'mark-mcconkey', 'Republican Party', 21058, 37143, 4992),
    (4, 'david-watters', 'Democratic Party', 19666, 32528, 6819),
    (5, 'suzanne-prentiss', 'Democratic Party', 23028, 34779, 11319),
    (6, 'james-gray', 'Republican Party', 18561, 31057, 6078),
    (7, 'daniel-innis-8747', 'Republican Party', 17888, 32242, 3551),
    (8, 'ruth-ward', 'Republican Party', 18463, 31653, 5285),
    (9, 'denise-ricciardi', 'Republican Party', 17235, 33471, 1024),
    (10, 'donovan-fenton-10599', 'Democratic Party', 20841, 33018, 8675),
    (11, 'tim-mcgough-11460', 'Republican Party', 18440, 36224, 673),
    (12, 'kevin-avard-928', 'Republican Party', 19841, 35505, 4198),
    (13, 'cindy-rosenwald-9406', 'Democratic Party', 14334, 25270, 3421),
    (14, 'sharon-carson-35', 'Republican Party', 19429, 33064, 5818),
    (15, 'tara-reardon-11461', 'Democratic Party', 20272, 32237, 8360),
    (16, 'keith-murphy-10698', 'Republican Party', 18435, 32554, 4355),
    (17, 'howard-pearl-10604', 'Republican Party', 19762, 34234, 5306),
    (18, 'victoria-sullivan-11462', 'Republican Party', 13289, 25848, 748),
    (19, 'regina-birdsell-926', 'Republican Party', 19505, 32102, 6949),
    (20, 'pat-long-11463', 'Democratic Party', 13159, 23476, 2869),
    (21, 'rebecca-perkins-kwoka-9856', 'Democratic Party', 22700, 33893, 11545),
    (22, 'daryl-abbas-10607', 'Republican Party', 22892, 35800, 9993),
    (23, 'bill-gannon-8745', 'Republican Party', 22670, 36354, 9022),
    (24, 'debra-altschiller-10600', 'Democratic Party', 20497, 37437, 3571)
)
INSERT INTO d1_person_candidate_roles (
  person_id, filer_entity_number, office_type, office, county, district,
  political_party, election_year, election_cycle, status, source,
  votes_received, total_contest_votes, winning_margin_votes, seats_available,
  election_result_source, updated_at
)
SELECT
  people.id,
  'nh-2024-ge-state-senate-' || printf('%02d', results.district) || '-' || people.slug,
  'General Court',
  'State Senate',
  NULL,
  CAST(results.district AS TEXT),
  results.political_party,
  2024,
  '2024 General Election',
  'elected',
  'NH Secretary of State',
  results.votes_received,
  results.total_contest_votes,
  results.winning_margin_votes,
  1,
  '2024-ge-state-senate-district-1-24_4.xls',
  CURRENT_TIMESTAMP
FROM election_results AS results
JOIN d1_people AS people ON people.slug = results.person_slug
WHERE 1
ON CONFLICT(filer_entity_number, election_year) DO UPDATE SET
  person_id = excluded.person_id,
  office_type = excluded.office_type,
  office = excluded.office,
  county = excluded.county,
  district = excluded.district,
  political_party = excluded.political_party,
  election_cycle = excluded.election_cycle,
  status = excluded.status,
  source = excluded.source,
  votes_received = excluded.votes_received,
  total_contest_votes = excluded.total_contest_votes,
  winning_margin_votes = excluded.winning_margin_votes,
  seats_available = excluded.seats_available,
  election_result_source = excluded.election_result_source,
  updated_at = CURRENT_TIMESTAMP;
