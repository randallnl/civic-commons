--------------------------------------------------
-- DIVISIONS
--------------------------------------------------

INSERT OR IGNORE INTO divisions (
  id,
  name,
  slug,
  type,
  parent_id,
  state
)
VALUES
(1, 'New Hampshire', 'nh', 'state', NULL, 'NH'),
(2, 'Hillsborough County', 'hillsborough', 'county', 1, 'NH'),
(3, 'Manchester', 'manchester', 'city', 2, 'NH'),
(4, 'Ward 1', 'ward-1', 'ward', 3, 'NH'),
(5, 'NH House Hillsborough District 12', 'nh-house-hillsborough-12', 'house_district', 1, 'NH'),
(6, 'NH Senate District 16', 'nh-senate-district-16', 'senate_district', 1, 'NH');

--------------------------------------------------
-- PEOPLE
--------------------------------------------------

INSERT OR IGNORE INTO people (
  id,
  full_name,
  slug,
  bio,
  party,
  website_url
)
VALUES
(
  1,
  'Jane Doe',
  'jane-doe',
  'Sample public official used for development.',
  'Independent',
  'https://example.com'
),
(
  2,
  'John Candidate',
  'john-candidate',
  'Sample candidate used for development.',
  'Democratic',
  'https://example.com/campaign'
),
(
  3,
  'Alex State Rep',
  'alex-state-rep',
  'Sample state representative used for vote testing.',
  'Democratic',
  'https://example.com/alex-state-rep'
);

--------------------------------------------------
-- POSITIONS
--------------------------------------------------

INSERT OR IGNORE INTO positions (
  id,
  title,
  slug,
  level,
  body,
  district,
  division_id,
  state
)
VALUES
(
  1,
  'Manchester Mayor',
  'manchester-mayor',
  'municipal',
  'Manchester City Government',
  NULL,
  3,
  'NH'
),
(
  2,
  'Ward 1 Alderman',
  'ward-1-alderman',
  'municipal',
  'Manchester Board of Mayor and Aldermen',
  'Ward 1',
  4,
  'NH'
),
(
  3,
  'State Representative',
  'nh-house-hillsborough-12-state-representative',
  'state',
  'New Hampshire House of Representatives',
  'Hillsborough District 12',
  5,
  'NH'
),
(
  4,
  'State Senator',
  'nh-senate-district-16-state-senator',
  'state',
  'New Hampshire Senate',
  'District 16',
  6,
  'NH'
);

--------------------------------------------------
-- OFFICE TERMS
--------------------------------------------------

INSERT OR IGNORE INTO office_terms (
  id,
  person_id,
  position_id,
  start_date,
  end_date,
  status,
  source_url
)
VALUES
(
  1,
  1,
  1,
  '2026-01-01',
  NULL,
  'current',
  'https://www.manchesternh.gov'
),
(
  2,
  3,
  3,
  '2024-12-04',
  NULL,
  'current',
  'https://www.gencourt.state.nh.us'
);

--------------------------------------------------
-- ELECTIONS
--------------------------------------------------

INSERT OR IGNORE INTO elections (
  id,
  name,
  slug,
  election_date,
  election_type,
  division_id
)
VALUES
(
  1,
  '2026 Manchester Municipal Election',
  '2026-manchester-municipal',
  '2026-11-03',
  'general',
  3
),
(
  2,
  '2026 New Hampshire General Election',
  '2026-new-hampshire-general',
  '2026-11-03',
  'general',
  1
),
(
  3,
  '2026 New Hampshire State Primary',
  '2026-new-hampshire-state-primary',
  '2026-09-08',
  'primary',
  1
);

--------------------------------------------------
-- CANDIDACIES
--------------------------------------------------

INSERT OR IGNORE INTO candidacies (
  id,
  person_id,
  election_id,
  position_id,
  party,
  status,
  filing_date,
  campaign_website_url
)
VALUES
(
  1,
  2,
  1,
  2,
  'Democratic',
  'active',
  NULL,
  'https://example.com/campaign'
),
(
  2,
  3,
  2,
  3,
  'Democratic',
  'active',
  NULL,
  'https://example.com/alex-state-rep'
);

--------------------------------------------------
-- POLLING LOCATIONS
--------------------------------------------------

INSERT OR IGNORE INTO polling_locations (
  id,
  division_id,
  ward,
  name,
  address,
  notes,
  source_url
)
VALUES
(
  1,
  4,
  'Ward 1',
  'Webster School',
  '2519 Elm Street, Manchester, NH',
  'Sample polling location for development.',
  'https://www.manchesternh.gov'
);

--------------------------------------------------
-- ORGANIZATIONS
--------------------------------------------------

INSERT OR IGNORE INTO organizations (
  id,
  name,
  slug,
  description,
  website_url
)
VALUES
(
  1,
  'Queerlective',
  'queerlective',
  'Sample civic and arts organization used for testing organization relationships.',
  'https://queerlective.com'
),
(
  2,
  '603 Forward',
  '603-forward',
  'Sample civic organization used for testing organization relationships.',
  'https://603forward.org'
);

--------------------------------------------------
-- RELATIONSHIPS
--------------------------------------------------

INSERT OR IGNORE INTO relationships (
  id,
  source_type,
  source_id,
  relationship_type,
  target_type,
  target_id
)
VALUES
(
  1,
  'organization',
  1,
  'LOCATED_IN',
  'division',
  3
),
(
  2,
  'organization',
  2,
  'OPERATES_IN',
  'division',
  1
),
(
  3,
  'person',
  1,
  'REPRESENTS',
  'division',
  3
),
(
  4,
  'person',
  3,
  'REPRESENTS',
  'division',
  5
);

--------------------------------------------------
-- LINKS
--------------------------------------------------

INSERT OR IGNORE INTO links (
  id,
  entity_type,
  entity_id,
  link_type,
  title,
  url,
  publisher,
  published_date,
  notes
)
VALUES
(
  1,
  'person',
  1,
  'official',
  'Official City Profile',
  'https://www.manchesternh.gov',
  'City of Manchester',
  NULL,
  'Sample official source link.'
),
(
  2,
  'person',
  1,
  'wikipedia',
  'Wikipedia',
  'https://en.wikipedia.org',
  'Wikipedia',
  NULL,
  NULL
),
(
  3,
  'person',
  1,
  'ballotpedia',
  'Ballotpedia',
  'https://ballotpedia.org',
  'Ballotpedia',
  NULL,
  NULL
),
(
  4,
  'person',
  3,
  'general_court',
  'General Court Profile',
  'https://www.gencourt.state.nh.us',
  'New Hampshire General Court',
  NULL,
  'Sample state legislator source link.'
),
(
  5,
  'person',
  3,
  'news',
  'Sample News Story About State Vote',
  'https://example.com/news-story',
  'Example News',
  '2026-01-15',
  'Sample news article link.'
),
(
  6,
  'division',
  3,
  'official',
  'Manchester City Website',
  'https://www.manchesternh.gov',
  'City of Manchester',
  NULL,
  NULL
);

--------------------------------------------------
-- BILLS
--------------------------------------------------

INSERT OR IGNORE INTO bills (
  id,
  session_year,
  bill_number,
  title,
  summary,
  status,
  general_court_url,
  legiscan_url
)
VALUES
(
  1,
  2026,
  'HB 100',
  'Sample Bill Relative to Civic Data',
  'A sample bill used for development and vote testing.',
  'In Committee',
  'https://www.gencourt.state.nh.us',
  'https://legiscan.com/NH'
);

--------------------------------------------------
-- ROLL CALLS
--------------------------------------------------

INSERT OR IGNORE INTO roll_calls (
  id,
  bill_id,
  chamber,
  vote_date,
  motion,
  result,
  source_url
)
VALUES
(
  1,
  1,
  'House',
  '2026-02-01',
  'Ought to Pass',
  'Passed',
  'https://www.gencourt.state.nh.us'
);

--------------------------------------------------
-- LEGISLATOR VOTES
--------------------------------------------------

INSERT OR IGNORE INTO legislator_votes (
  id,
  roll_call_id,
  person_id,
  vote
)
VALUES
(
  1,
  1,
  3,
  'yea'
);

--------------------------------------------------
-- CHANGE REQUESTS
--------------------------------------------------

INSERT OR IGNORE INTO change_requests (
  id,
  entity_type,
  entity_id,
  field_name,
  old_value,
  proposed_value,
  submitter_name,
  submitter_email,
  source_url,
  status
)
VALUES
(
  1,
  'polling_location',
  1,
  'address',
  '2519 Elm Street, Manchester, NH',
  '123 Updated Street, Manchester, NH',
  'Sample Submitter',
  'sample@example.com',
  'https://www.manchesternh.gov',
  'pending'
);