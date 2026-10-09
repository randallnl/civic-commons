-- Consolidate the duplicate Rich/Richard Lascelles profiles.
--
-- Person 103 is the canonical current-legislator record. Person 1072 owns the
-- active 2026 candidacy. Move the candidacy and any related records to person
-- 103, preserve the short URL as an alias, and retain profile analytics.

UPDATE d1_person_candidate_roles
SET person_id = 103,
    updated_at = CURRENT_TIMESTAMP
WHERE person_id = 1072;

UPDATE d1_person_legislator_roles
SET person_id = 103,
    updated_at = CURRENT_TIMESTAMP
WHERE person_id = 1072;

UPDATE d1_candidate_contributions
SET person_id = 103,
    updated_at = CURRENT_TIMESTAMP
WHERE person_id = 1072;

UPDATE d1_candidate_primary_results
SET person_id = 103,
    updated_at = CURRENT_TIMESTAMP
WHERE person_id = 1072;

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
  103,
  relation_type,
  source,
  raw_name,
  created_at
FROM d1_article_people
WHERE person_id = 1072;

DELETE FROM d1_article_people
WHERE person_id = 1072;

UPDATE community_update_mentions
SET person_id = 103,
    personid = 8331,
    employeeno = 408331,
    name = 'Richard Lascelles',
    path = '/people/richard-lascelles-8331'
WHERE person_id = 1072
   OR filer_entity_number = '867997216'
   OR path = '/people/rich-lascelles';

UPDATE links
SET entity_id = 103
WHERE entity_type IN ('person', 'candidate')
  AND entity_id = 1072;

UPDATE d1_person_profile_url_aliases
SET person_id = 103,
    updated_at = CURRENT_TIMESTAMP
WHERE person_id = 1072;

UPDATE organization_endorsements
SET candidate_name = 'Richard Lascelles',
    candidate_slug = 'richard-lascelles-8331',
    candidate_slug_key = 'richard-lascelles-8331',
    updated_at = CURRENT_TIMESTAMP
WHERE candidate_slug = 'rich-lascelles'
   OR candidate_slug_key = 'rich-lascelles';

UPDATE profile_update_submissions
SET person_key = 'richard-lascelles-8331',
    person_name = 'Richard Lascelles',
    page_url = CASE
      WHEN page_url LIKE '%/people/rich-lascelles%'
        THEN 'https://nhdeservesbetter.com/people/richard-lascelles-8331'
      ELSE page_url
    END
WHERE person_key IN ('1072', 'rich-lascelles')
   OR page_url LIKE '%/people/rich-lascelles%';

-- Merge visitor hashes first so the daily unique count can be recalculated
-- without double-counting the same visitor on the same date.
INSERT OR IGNORE INTO d1_profile_view_visitors (
  person_id,
  view_date,
  visitor_hash,
  created_at
)
SELECT
  103,
  view_date,
  visitor_hash,
  created_at
FROM d1_profile_view_visitors
WHERE person_id = 1072;

DELETE FROM d1_profile_view_visitors
WHERE person_id = 1072;

INSERT INTO d1_profile_view_daily (
  person_id,
  view_date,
  views,
  unique_visitors,
  first_viewed_at,
  last_viewed_at
)
SELECT
  103,
  view_date,
  views,
  unique_visitors,
  first_viewed_at,
  last_viewed_at
FROM d1_profile_view_daily
WHERE person_id = 1072
ON CONFLICT(person_id, view_date) DO UPDATE SET
  views = d1_profile_view_daily.views + excluded.views,
  first_viewed_at = MIN(d1_profile_view_daily.first_viewed_at, excluded.first_viewed_at),
  last_viewed_at = MAX(d1_profile_view_daily.last_viewed_at, excluded.last_viewed_at);

DELETE FROM d1_profile_view_daily
WHERE person_id = 1072;

UPDATE d1_profile_view_daily
SET unique_visitors = (
  SELECT COUNT(*)
  FROM d1_profile_view_visitors visitors
  WHERE visitors.person_id = 103
    AND visitors.view_date = d1_profile_view_daily.view_date
)
WHERE person_id = 103;

-- Release the unique filer number before assigning it to the canonical person.
UPDATE d1_people
SET filer_entity_number = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1072
  AND slug = 'rich-lascelles';

UPDATE d1_people
SET filer_entity_number = '867997216',
    is_2026_candidate = 1,
    name_aliases = CASE
      WHEN instr(lower(COALESCE(name_aliases, '')), 'rich lascelles') = 0
        THEN CASE
          WHEN trim(COALESCE(name_aliases, '')) = '' THEN 'Rich Lascelles'
          ELSE name_aliases || ', Rich Lascelles'
        END
      ELSE name_aliases
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 103
  AND slug = 'richard-lascelles-8331';

DELETE FROM d1_people
WHERE id = 1072
  AND slug = 'rich-lascelles'
  AND display_name = 'Rich Lascelles';

INSERT INTO d1_person_profile_url_aliases (
  alias_slug,
  person_id,
  created_at,
  updated_at
)
VALUES (
  'rich-lascelles',
  103,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT(alias_slug) DO UPDATE SET
  person_id = excluded.person_id,
  updated_at = CURRENT_TIMESTAMP;
