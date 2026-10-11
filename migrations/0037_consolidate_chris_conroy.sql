-- Consolidate the duplicate Chris/Christopher Conroy profiles.
--
-- Person 825 owns the complete public profile and short URL. Person 629 owns
-- the active 2026 candidate role and campaign-finance records. Move all linked
-- records to person 825, preserve the old profile URL as an alias, and activate
-- the surviving profile as a current 2026 candidate.

UPDATE d1_person_candidate_roles
SET person_id = 825,
    updated_at = CURRENT_TIMESTAMP
WHERE person_id = 629;

UPDATE d1_person_legislator_roles
SET person_id = 825,
    updated_at = CURRENT_TIMESTAMP
WHERE person_id = 629;

UPDATE d1_candidate_contributions
SET person_id = 825,
    updated_at = CURRENT_TIMESTAMP
WHERE person_id = 629;

UPDATE d1_candidate_primary_results
SET person_id = 825,
    updated_at = CURRENT_TIMESTAMP
WHERE person_id = 629;

INSERT OR IGNORE INTO d1_article_people (
  article_id,
  person_id,
  relation_type,
  source,
  raw_name,
  created_at
)
SELECT
  article_id,
  825,
  relation_type,
  source,
  raw_name,
  created_at
FROM d1_article_people
WHERE person_id = 629;

DELETE FROM d1_article_people
WHERE person_id = 629;

UPDATE community_update_mentions
SET person_id = 825,
    name = 'Chris Conroy',
    path = '/people/chris-conroy'
WHERE person_id = 629
   OR path = '/people/243681-christopher-conroy';

UPDATE links
SET entity_id = 825
WHERE entity_type IN ('person', 'candidate')
  AND entity_id = 629;

UPDATE d1_person_profile_url_aliases
SET person_id = 825,
    updated_at = CURRENT_TIMESTAMP
WHERE person_id = 629;

UPDATE organization_endorsements
SET candidate_name = 'Chris Conroy',
    candidate_slug = 'chris-conroy',
    candidate_slug_key = 'chris-conroy',
    updated_at = CURRENT_TIMESTAMP
WHERE candidate_slug = '243681-christopher-conroy'
   OR candidate_slug_key = '243681-christopher-conroy';

UPDATE profile_update_submissions
SET person_key = 'chris-conroy',
    person_name = 'Chris Conroy',
    page_url = CASE
      WHEN page_url LIKE '%/people/243681-christopher-conroy%'
        THEN 'https://nhdeservesbetter.com/people/chris-conroy'
      ELSE page_url
    END
WHERE person_key IN ('629', '243681-christopher-conroy')
   OR page_url LIKE '%/people/243681-christopher-conroy%';

-- Merge visitor hashes first so daily unique counts can be recalculated without
-- double-counting a visitor who opened both duplicate URLs on the same day.
INSERT OR IGNORE INTO d1_profile_view_visitors (
  person_id,
  view_date,
  visitor_hash,
  created_at
)
SELECT
  825,
  view_date,
  visitor_hash,
  created_at
FROM d1_profile_view_visitors
WHERE person_id = 629;

DELETE FROM d1_profile_view_visitors
WHERE person_id = 629;

INSERT INTO d1_profile_view_daily (
  person_id,
  view_date,
  views,
  unique_visitors,
  first_viewed_at,
  last_viewed_at
)
SELECT
  825,
  view_date,
  views,
  unique_visitors,
  first_viewed_at,
  last_viewed_at
FROM d1_profile_view_daily
WHERE person_id = 629
ON CONFLICT(person_id, view_date) DO UPDATE SET
  views = d1_profile_view_daily.views + excluded.views,
  first_viewed_at = MIN(d1_profile_view_daily.first_viewed_at, excluded.first_viewed_at),
  last_viewed_at = MAX(d1_profile_view_daily.last_viewed_at, excluded.last_viewed_at);

DELETE FROM d1_profile_view_daily
WHERE person_id = 629;

UPDATE d1_profile_view_daily
SET unique_visitors = (
  SELECT COUNT(*)
  FROM d1_profile_view_visitors visitors
  WHERE visitors.person_id = 825
    AND visitors.view_date = d1_profile_view_daily.view_date
)
WHERE person_id = 825;

UPDATE d1_people
SET is_2026_candidate = 1,
    name_aliases = CASE
      WHEN instr(lower(COALESCE(name_aliases, '')), 'christopher conroy') = 0
        THEN CASE
          WHEN trim(COALESCE(name_aliases, '')) = '' THEN 'Christopher Conroy'
          ELSE name_aliases || ', Christopher Conroy'
        END
      ELSE name_aliases
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 825
  AND slug = 'chris-conroy';

DELETE FROM d1_people
WHERE id = 629
  AND slug = '243681-christopher-conroy'
  AND display_name = 'Christopher Conroy';

INSERT INTO d1_person_profile_url_aliases (
  alias_slug,
  person_id,
  created_at,
  updated_at
)
VALUES (
  '243681-christopher-conroy',
  825,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT(alias_slug) DO UPDATE SET
  person_id = excluded.person_id,
  updated_at = CURRENT_TIMESTAMP;
