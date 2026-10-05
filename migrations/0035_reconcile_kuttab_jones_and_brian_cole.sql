-- Reconcile person records requested after the 2026 general-election audit.
--
-- * Katelyn Kuttab is a Republican in the 2026 Secretary of State list.
-- * Robert Jones is listed as Bob Jones; retain that nickname as an alias.
-- * Consolidate Brian Cole's duplicate candidate profiles into canonical person
--   96 while retaining the distinct roles and the old profile URLs.

UPDATE d1_people
SET party = 'Republican',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 259
  AND display_name = 'Katelyn Kuttab';

UPDATE d1_person_candidate_roles
SET political_party = 'Republican Party',
    updated_at = CURRENT_TIMESTAMP
WHERE person_id = 259
  AND election_year = 2026
  AND office = 'State Representative'
  AND county = 'Rockingham'
  AND district = '17';

UPDATE d1_people
SET name_aliases = CASE
      WHEN instr(lower(COALESCE(name_aliases, '')), 'bob jones') = 0
        THEN CASE WHEN trim(COALESCE(name_aliases, '')) = '' THEN 'Bob Jones'
                  ELSE name_aliases || ', Bob Jones' END
      ELSE name_aliases
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 826
  AND display_name = 'Robert Jones';

-- Preserve Brian Cole's distinct 2026 roles on the canonical person. The
-- duplicate profiles were not current-search records, so these two historical
-- candidacies remain non-current while the active State House role stays active.
INSERT INTO d1_person_candidate_roles (
  person_id,
  filer_entity_number,
  office_type,
  office,
  county,
  district,
  political_party,
  election_year,
  election_cycle,
  status,
  source,
  created_at,
  updated_at
)
VALUES
  (
    96,
    '590993362',
    'Federal',
    'Representative in Congress',
    NULL,
    '1',
    'Republican Party',
    2026,
    '2026 Election Cycle',
    'archived',
    'profile-consolidation-2026-10-04',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    96,
    '610107985',
    'Party Office',
    'Delegate to the State Convention',
    'Hillsborough',
    '41',
    'Republican Party',
    2026,
    '2026 Election Cycle',
    'archived',
    'profile-consolidation-2026-10-04',
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
  updated_at = CURRENT_TIMESTAMP;

-- Repoint any relational data that may have accumulated on either duplicate.
UPDATE d1_person_candidate_roles
SET person_id = 96,
    updated_at = CURRENT_TIMESTAMP
WHERE person_id IN (965, 1394);

UPDATE d1_person_legislator_roles
SET person_id = 96,
    updated_at = CURRENT_TIMESTAMP
WHERE person_id IN (965, 1394);

UPDATE d1_candidate_contributions
SET person_id = 96,
    updated_at = CURRENT_TIMESTAMP
WHERE person_id IN (965, 1394);

UPDATE d1_candidate_primary_results
SET person_id = 96,
    updated_at = CURRENT_TIMESTAMP
WHERE person_id IN (965, 1394);

UPDATE d1_article_people
SET person_id = 96
WHERE person_id IN (965, 1394);

UPDATE community_update_mentions
SET person_id = 96,
    path = '/people/brian-cole-7267'
WHERE person_id IN (965, 1394)
   OR filer_entity_number IN ('590993362', '610107985');

UPDATE links
SET entity_id = 96
WHERE entity_type IN ('person', 'candidate')
  AND entity_id IN (965, 1394);

UPDATE d1_person_profile_url_aliases
SET person_id = 96,
    updated_at = CURRENT_TIMESTAMP
WHERE person_id IN (965, 1394);

UPDATE organization_endorsements
SET candidate_slug = 'brian-cole-7267',
    updated_at = CURRENT_TIMESTAMP
WHERE candidate_slug IN (
  'brian-d-cole',
  'brian-d-cole-delegate-to-state-convention-hillsborough-41-rep'
);

UPDATE profile_update_submissions
SET person_key = 'brian-cole-7267',
    page_url = CASE
      WHEN page_url LIKE '%/people/brian-d-cole%'
        THEN 'https://nhdeservesbetter.com/people/brian-cole-7267'
      ELSE page_url
    END
WHERE person_key IN (
  '965',
  '1394',
  'brian-d-cole',
  'brian-d-cole-delegate-to-state-convention-hillsborough-41-rep'
);

-- Canonical Brian already carries the current legislative identity, photo,
-- score, and active State House role. Preserve the strongest boolean flags.
UPDATE d1_people
SET is_free_stater = MAX(
      is_free_stater,
      COALESCE((SELECT MAX(is_free_stater) FROM d1_people WHERE id IN (965, 1394)), 0)
    ),
    is_free_state_aligned_2026 = MAX(
      is_free_state_aligned_2026,
      COALESCE((SELECT MAX(is_free_state_aligned_2026) FROM d1_people WHERE id IN (965, 1394)), 0)
    ),
    is_tpaction_aligned_2026 = MAX(
      is_tpaction_aligned_2026,
      COALESCE((SELECT MAX(is_tpaction_aligned_2026) FROM d1_people WHERE id IN (965, 1394)), 0)
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE id = 96
  AND display_name = 'Brian Cole';

-- The duplicate profiles have no remaining owned records after the updates.
DELETE FROM d1_people
WHERE id IN (965, 1394)
  AND display_name = 'Brian Cole';

-- Keep both previous profile URLs working after consolidation.
INSERT INTO d1_person_profile_url_aliases (
  alias_slug,
  person_id,
  created_at,
  updated_at
)
VALUES
  ('brian-d-cole', 96, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (
    'brian-d-cole-delegate-to-state-convention-hillsborough-41-rep',
    96,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT(alias_slug) DO UPDATE SET
  person_id = excluded.person_id,
  updated_at = CURRENT_TIMESTAMP;
