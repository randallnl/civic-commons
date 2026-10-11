-- Reconcile the New Hampshire Liberty Alliance's updated 2026 general-election
-- endorsements with canonical person records.
--
-- The current endorsement page contains 143 candidates. Twelve of those names
-- had duplicate person records, usually because the candidate filing import
-- created a second profile for a sitting legislator. Consolidate those exact
-- pairs first, preserving roles, finance, content links, analytics, and legacy
-- profile URLs. The generated endorsement upsert follows this section.

CREATE TABLE _nhla_2026_person_merges (
  source_id INTEGER PRIMARY KEY,
  target_id INTEGER NOT NULL,
  source_slug TEXT NOT NULL,
  target_slug TEXT NOT NULL,
  target_name TEXT NOT NULL
);

INSERT INTO _nhla_2026_person_merges
  (source_id, target_id, source_slug, target_slug, target_name)
VALUES
  (649, 170, '243638-thomas-ploszaj', 'tom-ploszaj-9860', 'Tom Ploszaj'),
  (512, 216, '242480-sylvester-karasinski', 'sly-karasinski-10037', 'Sly Karasinski'),
  (510, 215, '242601-rita-jedrey-mattson', 'rita-mattson-10034', 'Rita Mattson'),
  (1031, 179, 'jim-qualey', 'james-qualey-9875', 'James Qualey'),
  (514, 380, '242112-merton-kesselring', 'steven-kesselring-11354', 'Steven Kesselring'),
  (515, 381, '242247-matthew-drew', 'matt-drew-11355', 'Matt Drew'),
  (562, 245, '242345-elizabeth-barbour', 'liz-barbour-10659', 'Liz Barbour'),
  (576, 1095, '243695-theodore-trost', 'ted-trost', 'Ted Trost'),
  (606, 81, '242693-g-brian-seaworth', 'brian-seaworth-944', 'Brian Seaworth'),
  (476, 108, '244326-jesse-edwards', 'jess-edwards-8392', 'Jess Edwards'),
  (434, 206, '242489-j-bernardy', 'jd-bernardy-9941', 'JD Bernardy'),
  (1265, 1016, 'dallas-emery-jr-delegate-to-state-convention-carroll-5-rep', 'dallas-emery-jr', 'Dallas Emery, Jr');

UPDATE d1_person_candidate_roles
SET person_id = (
      SELECT target_id FROM _nhla_2026_person_merges m
      WHERE m.source_id = d1_person_candidate_roles.person_id
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE person_id IN (SELECT source_id FROM _nhla_2026_person_merges);

UPDATE d1_person_legislator_roles
SET person_id = (
      SELECT target_id FROM _nhla_2026_person_merges m
      WHERE m.source_id = d1_person_legislator_roles.person_id
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE person_id IN (SELECT source_id FROM _nhla_2026_person_merges);

UPDATE d1_candidate_contributions
SET person_id = (
      SELECT target_id FROM _nhla_2026_person_merges m
      WHERE m.source_id = d1_candidate_contributions.person_id
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE person_id IN (SELECT source_id FROM _nhla_2026_person_merges);

UPDATE d1_candidate_primary_results
SET person_id = (
      SELECT target_id FROM _nhla_2026_person_merges m
      WHERE m.source_id = d1_candidate_primary_results.person_id
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE person_id IN (SELECT source_id FROM _nhla_2026_person_merges);

INSERT OR IGNORE INTO d1_article_people (
  article_id, person_id, relation_type, source, raw_name, created_at
)
SELECT
  ap.article_id, m.target_id, ap.relation_type, ap.source, ap.raw_name, ap.created_at
FROM d1_article_people ap
JOIN _nhla_2026_person_merges m ON m.source_id = ap.person_id;

DELETE FROM d1_article_people
WHERE person_id IN (SELECT source_id FROM _nhla_2026_person_merges);

UPDATE community_update_mentions
SET person_id = (
      SELECT target_id FROM _nhla_2026_person_merges m
      WHERE m.source_id = community_update_mentions.person_id
    ),
    name = (
      SELECT target_name FROM _nhla_2026_person_merges m
      WHERE m.source_id = community_update_mentions.person_id
    ),
    path = (
      SELECT '/people/' || target_slug FROM _nhla_2026_person_merges m
      WHERE m.source_id = community_update_mentions.person_id
    )
WHERE person_id IN (SELECT source_id FROM _nhla_2026_person_merges);

UPDATE community_update_mentions
SET person_id = (
      SELECT target_id FROM _nhla_2026_person_merges m
      WHERE '/people/' || m.source_slug = community_update_mentions.path
    ),
    name = (
      SELECT target_name FROM _nhla_2026_person_merges m
      WHERE '/people/' || m.source_slug = community_update_mentions.path
    ),
    path = (
      SELECT '/people/' || target_slug FROM _nhla_2026_person_merges m
      WHERE '/people/' || m.source_slug = community_update_mentions.path
    )
WHERE path IN (SELECT '/people/' || source_slug FROM _nhla_2026_person_merges);

UPDATE links
SET entity_id = (
  SELECT target_id FROM _nhla_2026_person_merges m
  WHERE m.source_id = links.entity_id
)
WHERE entity_type IN ('person', 'candidate')
  AND entity_id IN (SELECT source_id FROM _nhla_2026_person_merges);

UPDATE d1_person_profile_url_aliases
SET person_id = (
      SELECT target_id FROM _nhla_2026_person_merges m
      WHERE m.source_id = d1_person_profile_url_aliases.person_id
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE person_id IN (SELECT source_id FROM _nhla_2026_person_merges);

UPDATE organization_endorsements
SET candidate_name = (
      SELECT target_name FROM _nhla_2026_person_merges m
      WHERE m.source_slug = organization_endorsements.candidate_slug_key
    ),
    candidate_slug = (
      SELECT target_slug FROM _nhla_2026_person_merges m
      WHERE m.source_slug = organization_endorsements.candidate_slug_key
    ),
    candidate_slug_key = (
      SELECT target_slug FROM _nhla_2026_person_merges m
      WHERE m.source_slug = organization_endorsements.candidate_slug_key
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE candidate_slug_key IN (SELECT source_slug FROM _nhla_2026_person_merges);

UPDATE profile_update_submissions
SET person_key = (
      SELECT target_slug FROM _nhla_2026_person_merges m
      WHERE profile_update_submissions.person_key IN (CAST(m.source_id AS TEXT), m.source_slug)
         OR instr(COALESCE(profile_update_submissions.page_url, ''), '/people/' || m.source_slug) > 0
    ),
    person_name = (
      SELECT target_name FROM _nhla_2026_person_merges m
      WHERE profile_update_submissions.person_key IN (CAST(m.source_id AS TEXT), m.source_slug)
         OR instr(COALESCE(profile_update_submissions.page_url, ''), '/people/' || m.source_slug) > 0
    ),
    page_url = (
      SELECT 'https://nhdeservesbetter.com/people/' || target_slug
      FROM _nhla_2026_person_merges m
      WHERE profile_update_submissions.person_key IN (CAST(m.source_id AS TEXT), m.source_slug)
         OR instr(COALESCE(profile_update_submissions.page_url, ''), '/people/' || m.source_slug) > 0
    )
WHERE EXISTS (
  SELECT 1 FROM _nhla_2026_person_merges m
  WHERE profile_update_submissions.person_key IN (CAST(m.source_id AS TEXT), m.source_slug)
     OR instr(COALESCE(profile_update_submissions.page_url, ''), '/people/' || m.source_slug) > 0
);

INSERT OR IGNORE INTO d1_profile_view_visitors (
  person_id, view_date, visitor_hash, created_at
)
SELECT m.target_id, v.view_date, v.visitor_hash, v.created_at
FROM d1_profile_view_visitors v
JOIN _nhla_2026_person_merges m ON m.source_id = v.person_id;

DELETE FROM d1_profile_view_visitors
WHERE person_id IN (SELECT source_id FROM _nhla_2026_person_merges);

INSERT INTO d1_profile_view_daily (
  person_id, view_date, views, unique_visitors, first_viewed_at, last_viewed_at
)
SELECT
  m.target_id,
  d.view_date,
  SUM(d.views),
  SUM(d.unique_visitors),
  MIN(d.first_viewed_at),
  MAX(d.last_viewed_at)
FROM d1_profile_view_daily d
JOIN _nhla_2026_person_merges m ON m.source_id = d.person_id
GROUP BY m.target_id, d.view_date
ON CONFLICT(person_id, view_date) DO UPDATE SET
  views = d1_profile_view_daily.views + excluded.views,
  first_viewed_at = MIN(d1_profile_view_daily.first_viewed_at, excluded.first_viewed_at),
  last_viewed_at = MAX(d1_profile_view_daily.last_viewed_at, excluded.last_viewed_at);

DELETE FROM d1_profile_view_daily
WHERE person_id IN (SELECT source_id FROM _nhla_2026_person_merges);

UPDATE d1_profile_view_daily
SET unique_visitors = (
  SELECT COUNT(*)
  FROM d1_profile_view_visitors visitors
  WHERE visitors.person_id = d1_profile_view_daily.person_id
    AND visitors.view_date = d1_profile_view_daily.view_date
)
WHERE person_id IN (SELECT target_id FROM _nhla_2026_person_merges);

UPDATE d1_people
SET is_current_legislator = MAX(
      is_current_legislator,
      COALESCE((SELECT source.is_current_legislator FROM d1_people source JOIN _nhla_2026_person_merges m ON m.source_id = source.id WHERE m.target_id = d1_people.id), 0)
    ),
    is_2026_legislator = MAX(
      is_2026_legislator,
      COALESCE((SELECT source.is_2026_legislator FROM d1_people source JOIN _nhla_2026_person_merges m ON m.source_id = source.id WHERE m.target_id = d1_people.id), 0)
    ),
    is_2026_candidate = MAX(
      is_2026_candidate,
      COALESCE((SELECT source.is_2026_candidate FROM d1_people source JOIN _nhla_2026_person_merges m ON m.source_id = source.id WHERE m.target_id = d1_people.id), 0)
    ),
    is_free_stater = MAX(
      is_free_stater,
      COALESCE((SELECT source.is_free_stater FROM d1_people source JOIN _nhla_2026_person_merges m ON m.source_id = source.id WHERE m.target_id = d1_people.id), 0)
    ),
    is_free_state_aligned_2026 = MAX(
      is_free_state_aligned_2026,
      COALESCE((SELECT source.is_free_state_aligned_2026 FROM d1_people source JOIN _nhla_2026_person_merges m ON m.source_id = source.id WHERE m.target_id = d1_people.id), 0)
    ),
    is_tpaction_aligned_2026 = MAX(
      is_tpaction_aligned_2026,
      COALESCE((SELECT source.is_tpaction_aligned_2026 FROM d1_people source JOIN _nhla_2026_person_merges m ON m.source_id = source.id WHERE m.target_id = d1_people.id), 0)
    ),
    name_aliases = CASE
      WHEN instr(
        lower(',' || replace(COALESCE(name_aliases, ''), ', ', ',') || ','),
        lower(',' || (SELECT source.display_name FROM d1_people source JOIN _nhla_2026_person_merges m ON m.source_id = source.id WHERE m.target_id = d1_people.id) || ',')
      ) > 0 THEN name_aliases
      WHEN trim(COALESCE(name_aliases, '')) = ''
        THEN (SELECT source.display_name FROM d1_people source JOIN _nhla_2026_person_merges m ON m.source_id = source.id WHERE m.target_id = d1_people.id)
      ELSE name_aliases || ', ' || (SELECT source.display_name FROM d1_people source JOIN _nhla_2026_person_merges m ON m.source_id = source.id WHERE m.target_id = d1_people.id)
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (SELECT target_id FROM _nhla_2026_person_merges)
  AND EXISTS (
    SELECT 1
    FROM d1_people source
    JOIN _nhla_2026_person_merges m ON m.source_id = source.id
    WHERE m.target_id = d1_people.id
  );

DELETE FROM d1_people
WHERE id IN (SELECT source_id FROM _nhla_2026_person_merges);

INSERT INTO d1_person_profile_url_aliases (
  alias_slug, person_id, created_at, updated_at
)
SELECT source_slug, target_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM _nhla_2026_person_merges
WHERE true
ON CONFLICT(alias_slug) DO UPDATE SET
  person_id = excluded.person_id,
  updated_at = CURRENT_TIMESTAMP;

-- Dallas Emery's earlier Carroll 7 special-primary result remains historical.
-- The NHLA page and the candidate's campaign site identify him as a current
-- Carroll 5 general-election write-in candidate.
INSERT INTO d1_person_candidate_roles (
  person_id, filer_entity_number, office_type, office, county, district,
  political_party, election_year, election_cycle, status, source,
  created_at, updated_at
)
VALUES (
  1016,
  'nhla-2026-general-write-in-carroll-5-dallas-emery',
  'General Court',
  'State Representative',
  'Carroll',
  '5',
  'Republican Party',
  2026,
  '2026 General Election',
  'active',
  'https://www.nhliberty.org/2026-candidate-endorsements/',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
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
  updated_at = CURRENT_TIMESTAMP;

DROP TABLE _nhla_2026_person_merges;

-- Generated NHLA endorsement and alignment upsert follows.

CREATE TABLE _nhla_2026_endorsement_targets (
  source_name TEXT NOT NULL,
  db_name TEXT NOT NULL,
  slug TEXT PRIMARY KEY,
  city TEXT,
  county TEXT,
  district_no TEXT,
  office TEXT,
  party TEXT,
  display_district TEXT,
  statement TEXT NOT NULL
);

INSERT INTO _nhla_2026_endorsement_targets (
  source_name, db_name, slug, city, county, district_no, office, party,
  display_district, statement
)
VALUES
    ('James P. Gray', 'James Gray', 'james-gray', 'Rochester', '', '6', 'State Senator', 'Republican', 'District 6', 'New Hampshire Liberty Alliance endorsed James P. Gray for State Senate District 6 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Daniel E. Innis', 'Daniel Innis', 'daniel-innis-8747', 'Bradford', '', '7', 'State Senator', 'Republican', 'District 7', 'New Hampshire Liberty Alliance endorsed Daniel E. Innis for State Senate District 7 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Keith Murphy', 'Keith Murphy', 'keith-murphy-10698', 'Manchester', '', '16', 'State Senator', 'Republican', 'District 16', 'New Hampshire Liberty Alliance endorsed Keith Murphy for State Senate District 16 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Victoria Sullivan', 'Victoria Sullivan', 'victoria-sullivan-11462', 'Manchester', '', '18', 'State Senator', 'Republican', 'District 18', 'New Hampshire Liberty Alliance endorsed Victoria Sullivan for State Senate District 18 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Tom Ploszaj', 'Tom Ploszaj', 'tom-ploszaj-9860', 'Center Harbor', 'Belknap', '1', 'State Representative', 'Republican', 'Belknap 1', 'New Hampshire Liberty Alliance endorsed Tom Ploszaj for State Representative in Belknap District 1 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Scott Wallace', 'Scott Wallace', 'scott-wallace', 'Meredith', 'Belknap', '2', 'State Representative', 'Republican', 'Belknap 2', 'New Hampshire Liberty Alliance endorsed Scott Wallace for State Representative in Belknap District 2 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Paul Rossi', 'Paul Rossi', 'paul-rossi', 'Laconia', 'Belknap', '5', 'State Representative', 'Republican', 'Belknap 5', 'New Hampshire Liberty Alliance endorsed Paul Rossi for State Representative in Belknap District 5 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Paul A. Terry', 'Paul Terry', 'paul-terry', 'Alton', 'Belknap', '7', 'State Representative', 'Republican', 'Belknap 7', 'New Hampshire Liberty Alliance endorsed Paul A. Terry for State Representative in Belknap District 7 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Lisa M. Freeman', 'Lisa Freeman', 'lisa-freeman', 'Tilton', 'Belknap', '8', 'State Representative', 'Republican', 'Belknap 8', 'New Hampshire Liberty Alliance endorsed Lisa M. Freeman for State Representative in Belknap District 8 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Lino Avellani', 'Lino Avellani', 'lino-avellani', 'Sanbornville', 'Carroll', '4', 'State Representative', 'Republican', 'Carroll 4', 'New Hampshire Liberty Alliance endorsed Lino Avellani for State Representative in Carroll District 4 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Mike Belcher', 'Mike Belcher', 'mike-belcher', 'Sanbornville', 'Carroll', '4', 'State Representative', 'Republican', 'Carroll 4', 'New Hampshire Liberty Alliance endorsed Mike Belcher for State Representative in Carroll District 4 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Dallas Emery', 'Dallas Emery, Jr', 'dallas-emery-jr', 'Ossipee', 'Carroll', '5', 'State Representative', 'Republican', 'Carroll 5', 'New Hampshire Liberty Alliance endorsed Dallas Emery for State Representative in Carroll District 5 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Tammy Garthwaite', 'Tammy Simmons Garthwaite', '243675-tammy-garthwaite', 'Wakefield', 'Carroll', '8', 'State Representative', 'Republican', 'Carroll 8', 'New Hampshire Liberty Alliance endorsed Tammy Garthwaite for State Representative in Carroll District 8 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Colin Mitchell', 'Colin Mitchell', '244337-colin-mitchell', 'Wakefield', 'Carroll', '8', 'State Representative', 'Republican', 'Carroll 8', 'New Hampshire Liberty Alliance endorsed Colin Mitchell for State Representative in Carroll District 8 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Rich Nalevanko', 'Rich Nalevanko', 'rich-nalevanko', 'Alstead', 'Cheshire', '9', 'State Representative', 'Republican', 'Cheshire 9', 'New Hampshire Liberty Alliance endorsed Rich Nalevanko for State Representative in Cheshire District 9 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Sly Karasinski', 'Sly Karasinski', 'sly-karasinski-10037', 'North Swanzey', 'Cheshire', '10', 'State Representative', 'Republican', 'Cheshire 10', 'New Hampshire Liberty Alliance endorsed Sly Karasinski for State Representative in Cheshire District 10 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Matthew Santonastaso', 'Matthew Santonastaso', 'sos-2026-house-cheshire-13-matthew-santonastaso', 'Jaffrey', 'Cheshire', '13', 'State Representative', 'Republican', 'Cheshire 13', 'New Hampshire Liberty Alliance endorsed Matthew Santonastaso for State Representative in Cheshire District 13 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('John B. Hunt', 'John Hunt', 'john-hunt-414', 'Rindge', 'Cheshire', '14', 'State Representative', 'Republican', 'Cheshire 14', 'New Hampshire Liberty Alliance endorsed John B. Hunt for State Representative in Cheshire District 14 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Matthew Roach', 'Matthew Roach', 'matthew-roach', 'Hinsdale', 'Cheshire', '15', 'State Representative', 'Republican', 'Cheshire 15', 'New Hampshire Liberty Alliance endorsed Matthew Roach for State Representative in Cheshire District 15 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Rita Mattson', 'Rita Mattson', 'rita-mattson-10034', 'Dublin', 'Cheshire', '18', 'State Representative', 'Republican', 'Cheshire 18', 'New Hampshire Liberty Alliance endorsed Rita Mattson for State Representative in Cheshire District 18 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Jim Qualey', 'James Qualey', 'james-qualey-9875', 'Rindge', 'Cheshire', '18', 'State Representative', 'Republican', 'Cheshire 18', 'New Hampshire Liberty Alliance endorsed Jim Qualey for State Representative in Cheshire District 18 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Sam Hoehn', 'Sam Hoehn', 'sam-hoehn', 'Lancaster', 'Coos', '1', 'State Representative', 'Republican', 'Coos 1', 'New Hampshire Liberty Alliance endorsed Sam Hoehn for State Representative in Coos District 1 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Amy Norris', 'Amy Norris', 'amy-norris', 'Lancaster', 'Coos', '1', 'State Representative', 'Republican', 'Coos 1', 'New Hampshire Liberty Alliance endorsed Amy Norris for State Representative in Coos District 1 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Arnold G. Davis', 'Arnold Davis', 'arnold-davis', 'Berlin', 'Coos', '2', 'State Representative', 'Republican', 'Coos 2', 'New Hampshire Liberty Alliance endorsed Arnold G. Davis for State Representative in Coos District 2 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Seth King', 'Seth King', 'seth-king', 'Whitefield', 'Coos', '4', 'State Representative', 'Republican', 'Coos 4', 'New Hampshire Liberty Alliance endorsed Seth King for State Representative in Coos District 4 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Lori Korzen', 'Lori Korzen', 'lori-korzen', 'Berlin', 'Coos', '7', 'State Representative', 'Republican', 'Coos 7', 'New Hampshire Liberty Alliance endorsed Lori Korzen for State Representative in Coos District 7 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Calvin Beaulier', 'Calvin Beaulier', 'calvin-beaulier', 'Littleton', 'Grafton', '1', 'State Representative', 'Republican', 'Grafton 1', 'New Hampshire Liberty Alliance endorsed Calvin Beaulier for State Representative in Grafton District 1 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Marie Louise Bjelobrk', 'Marie Bjelobrk', 'marie-louise-bjelobrk', 'North Haverhill', 'Grafton', '5', 'State Representative', 'Republican', 'Grafton 5', 'New Hampshire Liberty Alliance endorsed Marie Louise Bjelobrk for State Representative in Grafton District 5 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Donald McFarlane', 'Donald McFarlane', 'donald-mcfarlane-10913', 'Orange', 'Grafton', '18', 'State Representative', 'Republican', 'Grafton 18', 'New Hampshire Liberty Alliance endorsed Donald McFarlane for State Representative in Grafton District 18 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Deborah Kruzel', 'Deborah Kruzel', 'deborah-kruzel', 'Pelham', 'Hillsborough', '1', 'State Representative', 'Republican', 'Hillsborough 1', 'New Hampshire Liberty Alliance endorsed Deborah Kruzel for State Representative in Hillsborough District 1 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Tom Mannion', 'Tom Mannion', 'tom-mannion', 'Pelham', 'Hillsborough', '1', 'State Representative', 'Republican', 'Hillsborough 1', 'New Hampshire Liberty Alliance endorsed Tom Mannion for State Representative in Hillsborough District 1 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Diane Rogers', 'Diane Rogers', 'diane-rogers', 'Pelham', 'Hillsborough', '1', 'State Representative', 'Republican', 'Hillsborough 1', 'New Hampshire Liberty Alliance endorsed Diane Rogers for State Representative in Hillsborough District 1 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Jeffrey F. Tenczar', 'Jeffrey Tenczar', 'jeffrey-tenczar', 'Pelham', 'Hillsborough', '1', 'State Representative', 'Republican', 'Hillsborough 1', 'New Hampshire Liberty Alliance endorsed Jeffrey F. Tenczar for State Representative in Hillsborough District 1 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Brian Labrie', 'Brian Labrie', 'brian-labrie', 'Bedford', 'Hillsborough', '2', 'State Representative', 'Republican', 'Hillsborough 2', 'New Hampshire Liberty Alliance endorsed Brian Labrie for State Representative in Hillsborough District 2 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Kristin Noble', 'Kristin Noble', 'kristin-noble', 'Bedford', 'Hillsborough', '2', 'State Representative', 'Republican', 'Hillsborough 2', 'New Hampshire Liberty Alliance endorsed Kristin Noble for State Representative in Hillsborough District 2 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('John Schneller', 'John Schneller', 'john-schneller', 'Bedford', 'Hillsborough', '2', 'State Representative', 'Republican', 'Hillsborough 2', 'New Hampshire Liberty Alliance endorsed John Schneller for State Representative in Hillsborough District 2 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Daniel Richardson', 'Daniel Richardson', 'daniel-richardson', 'Nashua', 'Hillsborough', '6', 'State Representative', 'Republican', 'Hillsborough 6', 'New Hampshire Liberty Alliance endorsed Daniel Richardson for State Representative in Hillsborough District 6 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Bill Ohm', 'Bill Ohm', 'bill-ohm-968', 'Nashua', 'Hillsborough', '10', 'State Representative', 'Republican', 'Hillsborough 10', 'New Hampshire Liberty Alliance endorsed Bill Ohm for State Representative in Hillsborough District 10 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Julie Miles', 'Julie Miles', 'julie-miles-11345', 'Merrimack', 'Hillsborough', '12', 'State Representative', 'Republican', 'Hillsborough 12', 'New Hampshire Liberty Alliance endorsed Julie Miles for State Representative in Hillsborough District 12 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Jeanine Notter', 'Jeanine Notter', 'jeanine-notter-639', 'Merrimack', 'Hillsborough', '12', 'State Representative', 'Republican', 'Hillsborough 12', 'New Hampshire Liberty Alliance endorsed Jeanine Notter for State Representative in Hillsborough District 12 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Wolfram von Schoen', 'Wolfram Schoen', 'wolfram-von-schoen', 'Merrimack', 'Hillsborough', '12', 'State Representative', 'Republican', 'Hillsborough 12', 'New Hampshire Liberty Alliance endorsed Wolfram von Schoen for State Representative in Hillsborough District 12 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Dillon Dumont', 'Dillon Dumont', 'dillon-dumont-11348', 'Hudson', 'Hillsborough', '13', 'State Representative', 'Republican', 'Hillsborough 13', 'New Hampshire Liberty Alliance endorsed Dillon Dumont for State Representative in Hillsborough District 13 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Cathy Kenny', 'Cathy Kenny', 'cathy-kenny', 'Hudson', 'Hillsborough', '13', 'State Representative', 'Republican', 'Hillsborough 13', 'New Hampshire Liberty Alliance endorsed Cathy Kenny for State Representative in Hillsborough District 13 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Andrew Prout', 'Andrew Prout', 'andrew-prout-8359', 'Hudson', 'Hillsborough', '13', 'State Representative', 'Republican', 'Hillsborough 13', 'New Hampshire Liberty Alliance endorsed Andrew Prout for State Representative in Hillsborough District 13 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Jordan Ulery', 'Jordan Ulery', 'jordan-ulery-520', 'Hudson', 'Hillsborough', '13', 'State Representative', 'Republican', 'Hillsborough 13', 'New Hampshire Liberty Alliance endorsed Jordan Ulery for State Representative in Hillsborough District 13 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Bob Wherry', 'Robert Wherry', 'robert-wherry-10641', 'Hudson', 'Hillsborough', '13', 'State Representative', 'Republican', 'Hillsborough 13', 'New Hampshire Liberty Alliance endorsed Bob Wherry for State Representative in Hillsborough District 13 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Raymond C. Peeples, Jr.', 'Raymond Peeples', 'raymond-peeples', 'Litchfield', 'Hillsborough', '14', 'State Representative', 'Republican', 'Hillsborough 14', 'New Hampshire Liberty Alliance endorsed Raymond C. Peeples, Jr. for State Representative in Hillsborough District 14 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Mark McLean', 'Mark McLean', 'mark-mclean-859', 'Manchester', 'Hillsborough', '15', 'State Representative', 'Republican', 'Hillsborough 15', 'New Hampshire Liberty Alliance endorsed Mark McLean for State Representative in Hillsborough District 15 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Steven Kesselring', 'Steven Kesselring', 'steven-kesselring-11354', 'Manchester', 'Hillsborough', '18', 'State Representative', 'Republican', 'Hillsborough 18', 'New Hampshire Liberty Alliance endorsed Steven Kesselring for State Representative in Hillsborough District 18 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Matt Drew', 'Matt Drew', 'matt-drew-11355', 'Manchester', 'Hillsborough', '19', 'State Representative', 'Republican', 'Hillsborough 19', 'New Hampshire Liberty Alliance endorsed Matt Drew for State Representative in Hillsborough District 19 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Mickey Mullin', 'Mickey Mullin', 'mickey-mullin', 'Manchester', 'Hillsborough', '19', 'State Representative', 'Republican', 'Hillsborough 19', 'New Hampshire Liberty Alliance endorsed Mickey Mullin for State Representative in Hillsborough District 19 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Pierre M. Dupont', 'Pierre Dupont', 'pierre-dupont-10644', 'Manchester', 'Hillsborough', '20', 'State Representative', 'Republican', 'Hillsborough 20', 'New Hampshire Liberty Alliance endorsed Pierre M. Dupont for State Representative in Hillsborough District 20 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Brittany Ping', 'Brittany Ping', 'brittany-ping', 'Manchester', 'Hillsborough', '22', 'State Representative', 'Republican', 'Hillsborough 22', 'New Hampshire Liberty Alliance endorsed Brittany Ping for State Representative in Hillsborough District 22 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Mary Murphy', 'Mary Murphy', 'mary-murphy-11360', 'Francestown', 'Hillsborough', '27', 'State Representative', 'Republican', 'Hillsborough 27', 'New Hampshire Liberty Alliance endorsed Mary Murphy for State Representative in Hillsborough District 27 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Keith Erf', 'Keith Erf', 'keith-erf-9416', 'Weare', 'Hillsborough', '28', 'State Representative', 'Republican', 'Hillsborough 28', 'New Hampshire Liberty Alliance endorsed Keith Erf for State Representative in Hillsborough District 28 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Joe Alexander', 'Joe Alexander', 'joe-alexander-9165', 'Goffstown', 'Hillsborough', '29', 'State Representative', 'Republican', 'Hillsborough 29', 'New Hampshire Liberty Alliance endorsed Joe Alexander for State Representative in Hillsborough District 29 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Henry R. Giasson III', 'Henry Giasson', 'henry-giasson-11363', 'Goffstown', 'Hillsborough', '29', 'State Representative', 'Republican', 'Hillsborough 29', 'New Hampshire Liberty Alliance endorsed Henry R. Giasson III for State Representative in Hillsborough District 29 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Sherri Reinfurt', 'Sherri Reinfurt', 'sherri-reinfurt-11364', 'Goffstown', 'Hillsborough', '29', 'State Representative', 'Republican', 'Hillsborough 29', 'New Hampshire Liberty Alliance endorsed Sherri Reinfurt for State Representative in Hillsborough District 29 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Diane Kelley', 'Diane Kelley', 'diane-kelley-9909', 'Temple', 'Hillsborough', '32', 'State Representative', 'Republican', 'Hillsborough 32', 'New Hampshire Liberty Alliance endorsed Diane Kelley for State Representative in Hillsborough District 32 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Jim Kofalt', 'Jim Kofalt', 'jim-kofalt-9895', 'Wilton', 'Hillsborough', '32', 'State Representative', 'Republican', 'Hillsborough 32', 'New Hampshire Liberty Alliance endorsed Jim Kofalt for State Representative in Hillsborough District 32 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Shane Sirois', 'Shane Sirois', 'shane-sirois-10653', 'New Ipswich', 'Hillsborough', '32', 'State Representative', 'Republican', 'Hillsborough 32', 'New Hampshire Liberty Alliance endorsed Shane Sirois for State Representative in Hillsborough District 32 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Liz Barbour', 'Liz Barbour', 'liz-barbour-10659', 'Hollis', 'Hillsborough', '35', 'State Representative', 'Republican', 'Hillsborough 35', 'New Hampshire Liberty Alliance endorsed Liz Barbour for State Representative in Hillsborough District 35 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Diane Pauer', 'Diane Pauer', 'diane-pauer-9910', 'Brookline', 'Hillsborough', '36', 'State Representative', 'Republican', 'Hillsborough 36', 'New Hampshire Liberty Alliance endorsed Diane Pauer for State Representative in Hillsborough District 36 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Adam Haverstock', 'Adam Haverstock', '243738-adam-haverstock', 'Hudson', 'Hillsborough', '38', 'State Representative', 'Republican', 'Hillsborough 38', 'New Hampshire Liberty Alliance endorsed Adam Haverstock for State Representative in Hillsborough District 38 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Ted Trost', 'Ted Trost', 'ted-trost', 'Hudson', 'Hillsborough', '38', 'State Representative', 'Republican', 'Hillsborough 38', 'New Hampshire Liberty Alliance endorsed Ted Trost for State Representative in Hillsborough District 38 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Jon DiPietro', 'Jon DiPietro', 'sos-2026-house-hillsborough-39-jon-dipietro', 'Manchester', 'Hillsborough', '39', 'State Representative', 'Republican', 'Hillsborough 39', 'New Hampshire Liberty Alliance endorsed Jon DiPietro for State Representative in Hillsborough District 39 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Ryan Hebert', 'Ryan Hebert', 'ryan-hebert', 'Manchester', 'Hillsborough', '41', 'State Representative', 'Republican', 'Hillsborough 41', 'New Hampshire Liberty Alliance endorsed Ryan Hebert for State Representative in Hillsborough District 41 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Gerald Griffin', 'Gerald Griffin', 'gerald-griffin-8314', 'Mont Vernon', 'Hillsborough', '42', 'State Representative', 'Republican', 'Hillsborough 42', 'New Hampshire Liberty Alliance endorsed Gerald Griffin for State Representative in Hillsborough District 42 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Rob Lovett', 'Rob Lovett', 'rob-lovett', 'Mont Vernon', 'Hillsborough', '42', 'State Representative', 'Republican', 'Hillsborough 42', 'New Hampshire Liberty Alliance endorsed Rob Lovett for State Representative in Hillsborough District 42 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Lisa C. M. Post', 'Lisa Post', 'lisa-post-9896', 'Lyndeborough', 'Hillsborough', '42', 'State Representative', 'Republican', 'Hillsborough 42', 'New Hampshire Liberty Alliance endorsed Lisa C. M. Post for State Representative in Hillsborough District 42 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Gary Daniels', 'Gary Daniels', 'gary-daniels-423', 'Milford', 'Hillsborough', '43', 'State Representative', 'Republican', 'Hillsborough 43', 'New Hampshire Liberty Alliance endorsed Gary Daniels for State Representative in Hillsborough District 43 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Elizabeth Keenan', 'Elizabeth Keenan', '242092-elizabeth-keenan', 'Milford', 'Hillsborough', '43', 'State Representative', 'Republican', 'Hillsborough 43', 'New Hampshire Liberty Alliance endorsed Elizabeth Keenan for State Representative in Hillsborough District 43 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Vanessa L. Sheehan', 'Vanessa Sheehan', 'vanessa-sheehan-9907', 'Milford', 'Hillsborough', '43', 'State Representative', 'Republican', 'Hillsborough 43', 'New Hampshire Liberty Alliance endorsed Vanessa L. Sheehan for State Representative in Hillsborough District 43 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Ross Berry', 'Ross Berry', 'ross-berry-9919', 'Weare', 'Hillsborough', '44', 'State Representative', 'Republican', 'Hillsborough 44', 'New Hampshire Liberty Alliance endorsed Ross Berry for State Representative in Hillsborough District 44 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Lisa Mazur', 'Lisa Mazur', 'lisa-mazur-10667', 'Goffstown', 'Hillsborough', '44', 'State Representative', 'Republican', 'Hillsborough 44', 'New Hampshire Liberty Alliance endorsed Lisa Mazur for State Representative in Hillsborough District 44 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Rick Devoid', 'Rick Devoid', 'rick-devoid', 'Boscawen', 'Merrimack', '1', 'State Representative', 'Republican', 'Merrimack 1', 'New Hampshire Liberty Alliance endorsed Rick Devoid for State Representative in Merrimack District 1 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Gregory Hill', 'Gregory Hill', 'gregory-hill', 'Northfield', 'Merrimack', '2', 'State Representative', 'Republican', 'Merrimack 2', 'New Hampshire Liberty Alliance endorsed Gregory Hill for State Representative in Merrimack District 2 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Michael Visconti', 'Michael Visconti', 'sos-2026-house-merrimack-3-michael-visconti', 'Franklin', 'Merrimack', '3', 'State Representative', 'Republican', 'Merrimack 3', 'New Hampshire Liberty Alliance endorsed Michael Visconti for State Representative in Merrimack District 3 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Michael Moffett', 'Michael Moffett', 'michael-moffett', 'Loudon', 'Merrimack', '4', 'State Representative', 'Republican', 'Merrimack 4', 'New Hampshire Liberty Alliance endorsed Michael Moffett for State Representative in Merrimack District 4 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Stephen Boyd', 'Stephen Boyd', 'stephen-boyd-9929', 'Hooksett', 'Merrimack', '10', 'State Representative', 'Republican', 'Merrimack 10', 'New Hampshire Liberty Alliance endorsed Stephen Boyd for State Representative in Merrimack District 10 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Pamela McMahon', 'PAMELA MCMAHON', '244270-pamela-mcmahon', 'Hooksett', 'Merrimack', '10', 'State Representative', 'Republican', 'Merrimack 10', 'New Hampshire Liberty Alliance endorsed Pamela McMahon for State Representative in Merrimack District 10 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Yury Polozov', 'Yury Polozov', 'yury-polozov-10676', 'Hooksett', 'Merrimack', '10', 'State Representative', 'Republican', 'Merrimack 10', 'New Hampshire Liberty Alliance endorsed Yury Polozov for State Representative in Merrimack District 10 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Thomas C. Walsh', 'Thomas Walsh', 'thomas-walsh-791', 'Hooksett', 'Merrimack', '10', 'State Representative', 'Republican', 'Merrimack 10', 'New Hampshire Liberty Alliance endorsed Thomas C. Walsh for State Representative in Merrimack District 10 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Matthew Pitaro', 'Matthew Pitaro', 'matthew-pitaro-9928', 'Allenstown', 'Merrimack', '11', 'State Representative', 'Republican', 'Merrimack 11', 'New Hampshire Liberty Alliance endorsed Matthew Pitaro for State Representative in Merrimack District 11 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Peter L. Mehegan', 'Peter Mehegan', 'peter-mehegan-11382', 'Pembroke', 'Merrimack', '12', 'State Representative', 'Republican', 'Merrimack 12', 'New Hampshire Liberty Alliance endorsed Peter L. Mehegan for State Representative in Merrimack District 12 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Brian Seaworth', 'Brian Seaworth', 'brian-seaworth-944', 'Pembroke', 'Merrimack', '12', 'State Representative', 'Republican', 'Merrimack 12', 'New Hampshire Liberty Alliance endorsed Brian Seaworth for State Representative in Merrimack District 12 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Cyril Aures', 'Cyril Aures', 'cyril-aures-10677', 'Chichester', 'Merrimack', '13', 'State Representative', 'Republican', 'Merrimack 13', 'New Hampshire Liberty Alliance endorsed Cyril Aures for State Representative in Merrimack District 13 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Clayton Wood', 'Clayton Wood', 'clayton-wood-10678', 'Pittsfield', 'Merrimack', '13', 'State Representative', 'Republican', 'Merrimack 13', 'New Hampshire Liberty Alliance endorsed Clayton Wood for State Representative in Merrimack District 13 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('James Thibault', 'James Thibault', 'james-thibault-10980', 'Franklin', 'Merrimack', '25', 'State Representative', 'Republican', 'Merrimack 25', 'New Hampshire Liberty Alliance endorsed James Thibault for State Representative in Merrimack District 25 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Alvin B. See', 'Alvin See', 'alvin-see-10682', 'Loudon', 'Merrimack', '26', 'State Representative', 'Republican', 'Merrimack 26', 'New Hampshire Liberty Alliance endorsed Alvin B. See for State Representative in Merrimack District 26 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Ray Plante', 'Ray Plante', 'raymond-plante-10121', 'Dunbarton', 'Merrimack', '27', 'State Representative', 'Republican', 'Merrimack 27', 'New Hampshire Liberty Alliance endorsed Ray Plante for State Representative in Merrimack District 27 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Vanessa Poulin', 'Vanessa Poulin', 'vanessa-poulin', 'Epsom', 'Merrimack', '27', 'State Representative', 'Republican', 'Merrimack 27', 'New Hampshire Liberty Alliance endorsed Vanessa Poulin for State Representative in Merrimack District 27 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('James Guzofski', 'James Guzofski', 'james-guzofski', 'Northwood', 'Rockingham', '1', 'State Representative', 'Republican', 'Rockingham 1', 'New Hampshire Liberty Alliance endorsed James Guzofski for State Representative in Rockingham District 1 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Paul Tudor', 'Paul Tudor', 'paul-tudor', 'Northwood', 'Rockingham', '1', 'State Representative', 'Republican', 'Rockingham 1', 'New Hampshire Liberty Alliance endorsed Paul Tudor for State Representative in Rockingham District 1 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Jason Osborne', 'Jason Osborne', 'jason-osborne', 'Auburn', 'Rockingham', '2', 'State Representative', 'Republican', 'Rockingham 2', 'New Hampshire Liberty Alliance endorsed Jason Osborne for State Representative in Rockingham District 2 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('James Spillane', 'James Spillane', 'james-spillane', 'Deerfield', 'Rockingham', '2', 'State Representative', 'Republican', 'Rockingham 2', 'New Hampshire Liberty Alliance endorsed James Spillane for State Representative in Rockingham District 2 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Cindy Bennett', 'Cindy Bennett', 'cindy-bennett', 'Raymond', 'Rockingham', '4', 'State Representative', 'Republican', 'Rockingham 4', 'New Hampshire Liberty Alliance endorsed Cindy Bennett for State Representative in Rockingham District 4 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Michael Drago', 'Michael Drago', 'michael-drago', 'Raymond', 'Rockingham', '4', 'State Representative', 'Republican', 'Rockingham 4', 'New Hampshire Liberty Alliance endorsed Michael Drago for State Representative in Rockingham District 4 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Brian Nadeau', 'Brian Nadeau', 'brian-nadeau', 'Raymond', 'Rockingham', '4', 'State Representative', 'Republican', 'Rockingham 4', 'New Hampshire Liberty Alliance endorsed Brian Nadeau for State Representative in Rockingham District 4 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Trevor Morse', 'Trevor Morse', '244348-trevor-morse', 'Epping', 'Rockingham', '5', 'State Representative', 'Republican', 'Rockingham 5', 'New Hampshire Liberty Alliance endorsed Trevor Morse for State Representative in Rockingham District 5 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Sayra Lynn DeVito', 'Sayra DeVito', 'sayra-devito', 'Danville', 'Rockingham', '8', 'State Representative', 'Republican', 'Rockingham 8', 'New Hampshire Liberty Alliance endorsed Sayra Lynn DeVito for State Representative in Rockingham District 8 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('James Scamman', 'James Scamman', 'james-scamman', 'Stratham', 'Rockingham', '12', 'State Representative', 'Republican', 'Rockingham 12', 'New Hampshire Liberty Alliance endorsed James Scamman for State Representative in Rockingham District 12 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Brandon Bach', 'Brandon Bach', 'brandon-bach', 'Derry', 'Rockingham', '13', 'State Representative', 'Republican', 'Rockingham 13', 'New Hampshire Liberty Alliance endorsed Brandon Bach for State Representative in Rockingham District 13 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Anthony Henry', 'Anthony Henry', '243714-anthony-henry', 'Derry', 'Rockingham', '13', 'State Representative', 'Republican', 'Rockingham 13', 'New Hampshire Liberty Alliance endorsed Anthony Henry for State Representative in Rockingham District 13 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Erica Layon', 'Erica Layon', 'erica-layon-9935', 'Derry', 'Rockingham', '13', 'State Representative', 'Republican', 'Rockingham 13', 'New Hampshire Liberty Alliance endorsed Erica Layon for State Representative in Rockingham District 13 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('David C. Love', 'David Love', 'david-love-8407', 'Derry', 'Rockingham', '13', 'State Representative', 'Republican', 'Rockingham 13', 'New Hampshire Liberty Alliance endorsed David C. Love for State Representative in Rockingham District 13 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('John Potucek', 'John Potucek', 'john-potucek-902', 'Derry', 'Rockingham', '13', 'State Representative', 'Republican', 'Rockingham 13', 'New Hampshire Liberty Alliance endorsed John Potucek for State Representative in Rockingham District 13 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Pam Brown', 'Pam Brown', 'pam-brown-11407', 'Kingston', 'Rockingham', '14', 'State Representative', 'Republican', 'Rockingham 14', 'New Hampshire Liberty Alliance endorsed Pam Brown for State Representative in Rockingham District 14 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Kenneth L. Weyler', 'Kenneth Weyler', 'kenneth-weyler-422', 'Kingston', 'Rockingham', '14', 'State Representative', 'Republican', 'Rockingham 14', 'New Hampshire Liberty Alliance endorsed Kenneth L. Weyler for State Representative in Rockingham District 14 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Ron Dunn', 'Ron Dunn', 'ron-dunn-10693', 'Londonderry', 'Rockingham', '16', 'State Representative', 'Republican', 'Rockingham 16', 'New Hampshire Liberty Alliance endorsed Ron Dunn for State Representative in Rockingham District 16 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Jeffrey McGraw', 'Jeffrey McGraw', 'jeffrey-mcgraw', 'Londonderry', 'Rockingham', '16', 'State Representative', 'Republican', 'Rockingham 16', 'New Hampshire Liberty Alliance endorsed Jeffrey McGraw for State Representative in Rockingham District 16 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Sherman Packard', 'Sherman Packard', 'sherman-packard-425', 'Londonderry', 'Rockingham', '16', 'State Representative', 'Republican', 'Rockingham 16', 'New Hampshire Liberty Alliance endorsed Sherman Packard for State Representative in Rockingham District 16 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Bob Lynn', 'Bob Lynn', 'bob-lynn-9937', 'Windham', 'Rockingham', '17', 'State Representative', 'Republican', 'Rockingham 17', 'New Hampshire Liberty Alliance endorsed Bob Lynn for State Representative in Rockingham District 17 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Daniel Popovici-Muller', 'Daniel Popovici-Muller', 'daniel-popovici-muller-10697', 'Windham', 'Rockingham', '17', 'State Representative', 'Republican', 'Rockingham 17', 'New Hampshire Liberty Alliance endorsed Daniel Popovici-Muller for State Representative in Rockingham District 17 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Debra L. DeSimone', 'Debra DeSimone', 'debra-desimone-570', 'Atkinson', 'Rockingham', '18', 'State Representative', 'Republican', 'Rockingham 18', 'New Hampshire Liberty Alliance endorsed Debra L. DeSimone for State Representative in Rockingham District 18 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Robert Harb', 'Robert Harb', 'robert-harb-9293', 'Plaistow', 'Rockingham', '20', 'State Representative', 'Republican', 'Rockingham 20', 'New Hampshire Liberty Alliance endorsed Robert Harb for State Representative in Rockingham District 20 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Joe Sweeney', 'Joe Sweeney', 'joe-sweeney-779', 'Salem', 'Rockingham', '25', 'State Representative', 'Republican', 'Rockingham 25', 'New Hampshire Liberty Alliance endorsed Joe Sweeney for State Representative in Rockingham District 25 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Jess Edwards', 'Jess Edwards', 'jess-edwards-8392', 'Auburn', 'Rockingham', '31', 'State Representative', 'Republican', 'Rockingham 31', 'New Hampshire Liberty Alliance endorsed Jess Edwards for State Representative in Rockingham District 31 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Melissa A. Litchfield', 'Melissa Litchfield', 'melissa-litchfield-9940', 'Brentwood', 'Rockingham', '32', 'State Representative', 'Republican', 'Rockingham 32', 'New Hampshire Liberty Alliance endorsed Melissa A. Litchfield for State Representative in Rockingham District 32 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Julius F. Soti', 'Julius Soti', 'julius-soti-9936', 'Windham', 'Rockingham', '35', 'State Representative', 'Republican', 'Rockingham 35', 'New Hampshire Liberty Alliance endorsed Julius F. Soti for State Representative in Rockingham District 35 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('JD Bernardy', 'JD Bernardy', 'jd-bernardy-9941', 'South Hampton', 'Rockingham', '36', 'State Representative', 'Republican', 'Rockingham 36', 'New Hampshire Liberty Alliance endorsed JD Bernardy for State Representative in Rockingham District 36 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Linda McGrath', 'Linda McGrath', 'linda-mcgrath-11421', 'Hampton', 'Rockingham', '40', 'State Representative', 'Republican', 'Rockingham 40', 'New Hampshire Liberty Alliance endorsed Linda McGrath for State Representative in Rockingham District 40 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Sue DeLemus', 'Susan DeLemus', 'sos-2026-house-strafford-1-sue-delemus', 'Farmington', 'Strafford', '1', 'State Representative', 'Republican', 'Strafford 1', 'New Hampshire Liberty Alliance endorsed Sue DeLemus for State Representative in Strafford District 1 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Glenn Bailey', 'Glenn Bailey', 'glenn-bailey', 'Milton', 'Strafford', '2', 'State Representative', 'Republican', 'Strafford 2', 'New Hampshire Liberty Alliance endorsed Glenn Bailey for State Representative in Strafford District 2 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Michael Granger', 'Michael Granger', 'michael-granger', 'Milton Mills', 'Strafford', '2', 'State Representative', 'Republican', 'Strafford 2', 'New Hampshire Liberty Alliance endorsed Michael Granger for State Representative in Strafford District 2 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Mark F. Racic', 'Mark Racic', 'mark-f-racic', 'Milton', 'Strafford', '2', 'State Representative', 'Republican', 'Strafford 2', 'New Hampshire Liberty Alliance endorsed Mark F. Racic for State Representative in Strafford District 2 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Susan G. DeRoy', 'Susan DeRoy', 'susan-deroy', 'New Durham', 'Strafford', '3', 'State Representative', 'Republican', 'Strafford 3', 'New Hampshire Liberty Alliance endorsed Susan G. DeRoy for State Representative in Strafford District 3 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('JoAnne Hack', 'JoAnne Hack', 'joanne-hack', 'Barrington', 'Strafford', '4', 'State Representative', 'Republican', 'Strafford 4', 'New Hampshire Liberty Alliance endorsed JoAnne Hack for State Representative in Strafford District 4 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Tanya Rich', 'Tanya Rich', 'sos-2026-house-strafford-4-tanya-rich', 'Strafford', 'Strafford', '4', 'State Representative', 'Republican', 'Strafford 4', 'New Hampshire Liberty Alliance endorsed Tanya Rich for State Representative in Strafford District 4 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Kurt Wuelper', 'Kurt Wuelper', '242731-kurt-wuelper', 'Strafford', 'Strafford', '4', 'State Representative', 'Republican', 'Strafford 4', 'New Hampshire Liberty Alliance endorsed Kurt Wuelper for State Representative in Strafford District 4 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('David Walker', 'David Walker', 'david-walker-10716', 'Rochester', 'Strafford', '8', 'State Representative', 'Republican', 'Strafford 8', 'New Hampshire Liberty Alliance endorsed David Walker for State Representative in Strafford District 8 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Robert Qua', 'Robert Qua', '244358-robert-qua', 'Rochester', 'Strafford', '9', 'State Representative', 'Republican', 'Strafford 9', 'New Hampshire Liberty Alliance endorsed Robert Qua for State Representative in Strafford District 9 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Samuel Farrington', 'Samuel Farrington', 'samuel-farrington', 'Rochester', 'Strafford', '19', 'State Representative', 'Republican', 'Strafford 19', 'New Hampshire Liberty Alliance endorsed Samuel Farrington for State Representative in Strafford District 19 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('James Higginbottom', 'James Higginbottom', 'sos-2026-house-strafford-19-james-higginbottom', 'Rochester', 'Strafford', '19', 'State Representative', 'Republican', 'Strafford 19', 'New Hampshire Liberty Alliance endorsed James Higginbottom for State Representative in Strafford District 19 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Skip Rollins', 'Skip Rollins', 'skip-rollins', 'Newport', 'Sullivan', '3', 'State Representative', 'Republican', 'Sullivan 3', 'New Hampshire Liberty Alliance endorsed Skip Rollins for State Representative in Sullivan District 3 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Steven Smith', 'Steven Smith', 'steven-smith', 'Charlestown', 'Sullivan', '3', 'State Representative', 'Republican', 'Sullivan 3', 'New Hampshire Liberty Alliance endorsed Steven Smith for State Representative in Sullivan District 3 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Walter Spilsbury', 'Walter Spilsbury', 'walter-spilsbury', 'Charlestown', 'Sullivan', '3', 'State Representative', 'Republican', 'Sullivan 3', 'New Hampshire Liberty Alliance endorsed Walter Spilsbury for State Representative in Sullivan District 3 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Ron Rule', 'Ron Rule', 'ron-rule', 'Langdon', 'Sullivan', '4', 'State Representative', 'Republican', 'Sullivan 4', 'New Hampshire Liberty Alliance endorsed Ron Rule for State Representative in Sullivan District 4 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('George C. Grant', 'George Grant', 'george-grant', 'Sunapee', 'Sullivan', '5', 'State Representative', 'Republican', 'Sullivan 5', 'New Hampshire Liberty Alliance endorsed George C. Grant for State Representative in Sullivan District 5 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Emily Sandblade', 'Emily Sandblade', 'emily-sandblade', 'Claremont', 'Sullivan', '6', 'State Representative', 'Republican', 'Sullivan 6', 'New Hampshire Liberty Alliance endorsed Emily Sandblade for State Representative in Sullivan District 6 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Margaret M. Drye', 'Margaret Drye', 'margaret-drye', 'Plainfield', 'Sullivan', '7', 'State Representative', 'Republican', 'Sullivan 7', 'New Hampshire Liberty Alliance endorsed Margaret M. Drye for State Representative in Sullivan District 7 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Catherine Peschke', 'Catherine Peschke', 'catherine-peschke', 'Croydon', 'Sullivan', '8', 'State Representative', 'Republican', 'Sullivan 8', 'New Hampshire Liberty Alliance endorsed Catherine Peschke for State Representative in Sullivan District 8 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.'),
    ('Jonathan F. Stone', 'Jonathan Stone', '242430-jonathan-stone', 'Claremont', 'Sullivan', '8', 'State Representative', 'Republican', 'Sullivan 8', 'New Hampshire Liberty Alliance endorsed Jonathan F. Stone for State Representative in Sullivan District 8 in the 2026 election cycle. Source: https://www.nhliberty.org/2026-candidate-endorsements/ Learn more about the Free State Aligned designation: https://nhdeservesbetter.com/free-staters.');

UPDATE d1_people
SET is_free_state_aligned_2026 = 1,
    is_2026_candidate = CASE
      WHEN EXISTS (
        SELECT 1
        FROM d1_person_candidate_roles role
        WHERE role.person_id = d1_people.id
          AND role.election_year = 2026
          AND role.status = 'active'
      ) THEN 1
      ELSE is_2026_candidate
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE slug IN (SELECT slug FROM _nhla_2026_endorsement_targets);

UPDATE organization_endorsements
SET candidate_name = (SELECT db_name FROM _nhla_2026_endorsement_targets targets WHERE targets.slug = organization_endorsements.candidate_slug_key),
    candidate_slug = candidate_slug_key,
    office = (SELECT office FROM _nhla_2026_endorsement_targets targets WHERE targets.slug = organization_endorsements.candidate_slug_key),
    district = (SELECT display_district FROM _nhla_2026_endorsement_targets targets WHERE targets.slug = organization_endorsements.candidate_slug_key),
    election_year = '2026',
    position = 'Free State Aligned',
    statement = CASE
      WHEN instr(COALESCE(statement, ''), 'https://www.nhliberty.org/2026-candidate-endorsements/') > 0 THEN statement
      WHEN source = 'nhla-2026-rating' THEN
        (SELECT statement FROM _nhla_2026_endorsement_targets targets WHERE targets.slug = organization_endorsements.candidate_slug_key) || ' ' || statement
      ELSE (SELECT statement FROM _nhla_2026_endorsement_targets targets WHERE targets.slug = organization_endorsements.candidate_slug_key)
    END,
    date = COALESCE(NULLIF(date, ''), '2026-10-11'),
    status = 'published',
    source = 'https://www.nhliberty.org/2026-candidate-endorsements/',
    organization_website = 'https://www.nhliberty.org/',
    reviewed_by = 'admin',
    reviewed_at = CURRENT_TIMESTAMP,
    workflow_status = 'approved',
    workflow_updated_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (
  SELECT (
    SELECT e.id
    FROM organization_endorsements e
    WHERE e.organization_slug = 'new-hampshire-liberty-alliance'
      AND e.election_year = '2026'
      AND e.candidate_slug_key = targets.slug
      AND e.status = 'published'
    ORDER BY
      CASE
        WHEN e.source = 'https://www.nhliberty.org/2026-candidate-endorsements/' THEN 0
        WHEN e.position = 'Endorsed' THEN 1
        ELSE 2
      END,
      e.id
    LIMIT 1
  )
  FROM _nhla_2026_endorsement_targets targets
);

INSERT INTO organization_endorsements (
  organization_slug, organization_name, organization_website,
  candidate_name, candidate_slug, candidate_slug_key, office, district,
  election_year, position, statement, date, status, source,
  reviewed_by, reviewed_at, workflow_status, workflow_updated_at,
  created_at, updated_at
)
SELECT
  'new-hampshire-liberty-alliance', 'New Hampshire Liberty Alliance', 'https://www.nhliberty.org/',
  db_name, slug, slug, office, display_district,
  '2026', 'Free State Aligned', statement, '2026-10-11', 'published', 'https://www.nhliberty.org/2026-candidate-endorsements/',
  'admin', CURRENT_TIMESTAMP, 'approved', CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM _nhla_2026_endorsement_targets targets
WHERE NOT EXISTS (
  SELECT 1
  FROM organization_endorsements e
  WHERE e.organization_slug = 'new-hampshire-liberty-alliance'
    AND e.election_year = '2026'
    AND e.candidate_slug_key = targets.slug
    AND e.status = 'published'
);

DROP TABLE _nhla_2026_endorsement_targets;
