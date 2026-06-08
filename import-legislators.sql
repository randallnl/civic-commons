--------------------------------------------------
-- PEOPLE FROM NHDB LEGISLATORS
--------------------------------------------------

INSERT OR IGNORE INTO people (
  id,
  full_name,
  slug,
  party,
  email,
  created_at,
  updated_at
)
SELECT
  personid,
  trim(firstname || ' ' || lastname),
  lower(
    replace(
      replace(trim(firstname || '-' || lastname), ' ', '-'),
      '''',
      ''
    )
  ),
  party,
  emailaddress,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM d1_legislators
WHERE active = 1;

--------------------------------------------------
-- STATE HOUSE / SENATE DISTRICTS AS DIVISIONS
--------------------------------------------------

INSERT OR IGNORE INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state
)
SELECT DISTINCT
  CASE
    WHEN legislativebody = 'H' THEN 'NH House District ' || district
    WHEN legislativebody = 'S' THEN 'NH Senate District ' || district
    ELSE 'NH Legislative District ' || district
  END,
  CASE
    WHEN legislativebody = 'H' THEN 'nh-house-district-' || lower(replace(district, ' ', '-'))
    WHEN legislativebody = 'S' THEN 'nh-senate-district-' || lower(replace(district, ' ', '-'))
    ELSE 'nh-legislative-district-' || lower(replace(district, ' ', '-'))
  END,
  CASE
    WHEN legislativebody = 'H' THEN 'house_district'
    WHEN legislativebody = 'S' THEN 'senate_district'
    ELSE 'legislative_district'
  END,
  1,
  'NH'
FROM d1_legislators
WHERE active = 1
  AND district IS NOT NULL;

--------------------------------------------------
-- POSITIONS
--------------------------------------------------

INSERT OR IGNORE INTO positions (
  title,
  slug,
  level,
  body,
  district,
  division_id,
  state,
  created_at,
  updated_at
)
SELECT DISTINCT
  CASE
    WHEN l.legislativebody = 'H' THEN 'State Representative'
    WHEN l.legislativebody = 'S' THEN 'State Senator'
    ELSE 'State Legislator'
  END,
  CASE
    WHEN l.legislativebody = 'H' THEN 'nh-house-district-' || lower(replace(l.district, ' ', '-')) || '-state-representative-' || l.seatno
    WHEN l.legislativebody = 'S' THEN 'nh-senate-district-' || lower(replace(l.district, ' ', '-')) || '-state-senator'
    ELSE 'nh-legislative-district-' || lower(replace(l.district, ' ', '-')) || '-state-legislator'
  END,
  'state',
  CASE
    WHEN l.legislativebody = 'H' THEN 'New Hampshire House of Representatives'
    WHEN l.legislativebody = 'S' THEN 'New Hampshire Senate'
    ELSE 'New Hampshire General Court'
  END,
  l.district,
  d.id,
  'NH',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM d1_legislators l
JOIN divisions d
  ON d.slug =
    CASE
      WHEN l.legislativebody = 'H' THEN 'nh-house-district-' || lower(replace(l.district, ' ', '-'))
      WHEN l.legislativebody = 'S' THEN 'nh-senate-district-' || lower(replace(l.district, ' ', '-'))
      ELSE 'nh-legislative-district-' || lower(replace(l.district, ' ', '-'))
    END
WHERE l.active = 1;

--------------------------------------------------
-- OFFICE TERMS
--------------------------------------------------

INSERT OR IGNORE INTO office_terms (
  person_id,
  position_id,
  status,
  source_url,
  created_at,
  updated_at
)
SELECT
  l.personid,
  p.id,
  'current',
  'https://www.gencourt.state.nh.us',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM d1_legislators l
JOIN positions p
  ON p.slug =
    CASE
      WHEN l.legislativebody = 'H' THEN 'nh-house-district-' || lower(replace(l.district, ' ', '-')) || '-state-representative-' || l.seatno
      WHEN l.legislativebody = 'S' THEN 'nh-senate-district-' || lower(replace(l.district, ' ', '-')) || '-state-senator'
      ELSE 'nh-legislative-district-' || lower(replace(l.district, ' ', '-')) || '-state-legislator'
    END
WHERE l.active = 1;

--------------------------------------------------
-- GENERAL COURT LINKS
--------------------------------------------------

INSERT OR IGNORE INTO links (
  entity_type,
  entity_id,
  link_type,
  title,
  url,
  publisher,
  notes
)
SELECT
  'person',
  personid,
  'general_court',
  'General Court Profile',
  'https://www.gencourt.state.nh.us',
  'New Hampshire General Court',
  'Imported from nhdb d1_legislators.'
FROM d1_legislators
WHERE active = 1;