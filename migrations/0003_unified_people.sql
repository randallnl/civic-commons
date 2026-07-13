-- Canonical NHDB person identity table.
-- This intentionally uses the d1_ prefix because the legacy app already has a
-- generic people table from the original schema.

CREATE TABLE IF NOT EXISTS d1_people (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gc_personid INTEGER UNIQUE,
  employeeno INTEGER UNIQUE,
  filer_entity_number TEXT UNIQUE,
  firstname TEXT,
  lastname TEXT,
  middlename TEXT,
  display_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  party TEXT,
  email TEXT,
  phone TEXT,
  website_url TEXT,
  photo_url TEXT,
  is_current_legislator INTEGER NOT NULL DEFAULT 0,
  is_2026_legislator INTEGER NOT NULL DEFAULT 0,
  is_2026_candidate INTEGER NOT NULL DEFAULT 0,
  is_free_stater INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'migration',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_d1_people_name
ON d1_people(lastname, firstname);

CREATE INDEX IF NOT EXISTS idx_d1_people_candidate
ON d1_people(is_2026_candidate, filer_entity_number);

CREATE INDEX IF NOT EXISTS idx_d1_people_legislator
ON d1_people(is_current_legislator, gc_personid);

CREATE TABLE IF NOT EXISTS d1_person_legislator_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id INTEGER NOT NULL,
  gc_personid INTEGER,
  employeeno INTEGER,
  legislativebody TEXT,
  countycode TEXT,
  district TEXT,
  seatno TEXT,
  towns_represented TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  session_year INTEGER NOT NULL DEFAULT 2026,
  source TEXT NOT NULL DEFAULT 'd1_legislators',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (person_id) REFERENCES d1_people(id),
  UNIQUE(person_id, legislativebody, countycode, district, session_year)
);

CREATE INDEX IF NOT EXISTS idx_d1_person_legislator_roles_lookup
ON d1_person_legislator_roles(legislativebody, countycode, district, active);

CREATE TABLE IF NOT EXISTS d1_person_candidate_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id INTEGER NOT NULL,
  filer_entity_number TEXT NOT NULL,
  office_type TEXT,
  office TEXT,
  county TEXT,
  district TEXT,
  political_party TEXT,
  election_year INTEGER NOT NULL DEFAULT 2026,
  election_cycle TEXT,
  total_raised REAL,
  total_spent REAL,
  status TEXT NOT NULL DEFAULT 'active',
  source TEXT NOT NULL DEFAULT 'candidates',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (person_id) REFERENCES d1_people(id),
  UNIQUE(filer_entity_number, election_year)
);

CREATE INDEX IF NOT EXISTS idx_d1_person_candidate_roles_lookup
ON d1_person_candidate_roles(office, county, district, election_year);

CREATE TABLE IF NOT EXISTS d1_article_people (
  article_id INTEGER NOT NULL,
  person_id INTEGER NOT NULL,
  relation_type TEXT NOT NULL DEFAULT 'mentioned',
  source TEXT NOT NULL DEFAULT 'migration',
  raw_name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(article_id, person_id, relation_type),
  FOREIGN KEY (person_id) REFERENCES d1_people(id)
);

CREATE INDEX IF NOT EXISTS idx_d1_article_people_person
ON d1_article_people(person_id);

-- Current legislators become people first because gc_personid is the strongest
-- existing stable identifier.
INSERT OR IGNORE INTO d1_people (
  gc_personid,
  employeeno,
  firstname,
  lastname,
  middlename,
  display_name,
  slug,
  party,
  email,
  photo_url,
  is_current_legislator,
  is_2026_legislator,
  is_free_stater,
  source,
  updated_at
)
SELECT
  l.personid,
  l.employeeno,
  l.firstname,
  l.lastname,
  l.middlename,
  TRIM(COALESCE(l.firstname, '') || ' ' || COALESCE(l.lastname, '')),
  LOWER(
    REPLACE(
      REPLACE(
        REPLACE(
          TRIM(COALESCE(l.firstname, '') || '-' || COALESCE(l.lastname, '') || '-' || l.personid),
          ' ', '-'
        ),
        '''',
        ''
      ),
      '.',
      ''
    )
  ),
  l.party,
  l.emailaddress,
  COALESCE(p.photo_url, ''),
  CASE WHEN COALESCE(l.active, 0) = 1 THEN 1 ELSE 0 END,
  CASE WHEN COALESCE(l.active, 0) = 1 THEN 1 ELSE 0 END,
  CASE
    WHEN LOWER(CAST(COALESCE(l.is_free_stater, '') AS TEXT)) IN ('1', 'true', 'yes') THEN 1
    ELSE 0
  END,
  'd1_legislators',
  CURRENT_TIMESTAMP
FROM d1_legislators l
LEFT JOIN d1_legislator_photos p
  ON p.employeeno = l.employeeno;

INSERT OR IGNORE INTO d1_person_legislator_roles (
  person_id,
  gc_personid,
  employeeno,
  legislativebody,
  countycode,
  district,
  seatno,
  active,
  session_year,
  updated_at
)
SELECT
  people.id,
  l.personid,
  l.employeeno,
  l.legislativebody,
  l.countycode,
  l.district,
  l.seatno,
  COALESCE(l.active, 0),
  2026,
  CURRENT_TIMESTAMP
FROM d1_legislators l
JOIN d1_people people
  ON people.gc_personid = l.personid;

-- Explicit admin links are the safest candidate-to-legislator match. Merge
-- linked candidate metadata onto the existing legislator person row.
UPDATE d1_people
SET
  filer_entity_number = COALESCE(
    filer_entity_number,
    (
      SELECT c.filer_entity_number
      FROM admin_candidate_legislator_links acl
      JOIN candidates c
        ON c.filer_entity_number = acl.candidate_filer_entity_number
      WHERE acl.representative_personid = d1_people.gc_personid
      LIMIT 1
    )
  ),
  website_url = COALESCE(
    NULLIF(website_url, ''),
    (
      SELECT c.candidate_website
      FROM admin_candidate_legislator_links acl
      JOIN candidates c
        ON c.filer_entity_number = acl.candidate_filer_entity_number
      WHERE acl.representative_personid = d1_people.gc_personid
      LIMIT 1
    )
  ),
  photo_url = COALESCE(
    NULLIF(photo_url, ''),
    (
      SELECT c.photo_url
      FROM admin_candidate_legislator_links acl
      JOIN candidates c
        ON c.filer_entity_number = acl.candidate_filer_entity_number
      WHERE acl.representative_personid = d1_people.gc_personid
      LIMIT 1
    )
  ),
  is_2026_candidate = CASE
    WHEN EXISTS (
      SELECT 1
      FROM admin_candidate_legislator_links acl
      JOIN candidates c
        ON c.filer_entity_number = acl.candidate_filer_entity_number
      WHERE acl.representative_personid = d1_people.gc_personid
        AND c.election_year = 2026
    ) THEN 1
    ELSE is_2026_candidate
  END,
  is_free_stater = CASE
    WHEN EXISTS (
      SELECT 1
      FROM admin_candidate_legislator_links acl
      JOIN candidates c
        ON c.filer_entity_number = acl.candidate_filer_entity_number
      WHERE acl.representative_personid = d1_people.gc_personid
        AND LOWER(CAST(COALESCE(c.is_free_stater, '') AS TEXT)) IN ('1', 'true', 'yes')
    ) THEN 1
    ELSE is_free_stater
  END,
  updated_at = CURRENT_TIMESTAMP
WHERE EXISTS (
  SELECT 1
  FROM admin_candidate_legislator_links acl
  WHERE acl.representative_personid = d1_people.gc_personid
);

-- Strong automatic match for current legislators who are also candidates but do
-- not have an explicit admin link yet.
UPDATE d1_people
SET
  filer_entity_number = COALESCE(
    filer_entity_number,
    (
      SELECT c.filer_entity_number
      FROM candidates c
      WHERE LOWER(TRIM(c.candidate_first_name)) = LOWER(TRIM(d1_people.firstname))
        AND LOWER(TRIM(c.candidate_last_name)) = LOWER(TRIM(d1_people.lastname))
        AND (
          (c.office = 'State Representative' AND d1_people.gc_personid IN (
            SELECT r.gc_personid
            FROM d1_person_legislator_roles r
            WHERE r.person_id = d1_people.id
              AND r.legislativebody = 'H'
              AND r.district = c.district
          ))
          OR
          (c.office IN ('State Senate', 'State Senator') AND d1_people.gc_personid IN (
            SELECT r.gc_personid
            FROM d1_person_legislator_roles r
            WHERE r.person_id = d1_people.id
              AND r.legislativebody = 'S'
              AND r.district = c.district
          ))
        )
      LIMIT 1
    )
  ),
  is_2026_candidate = CASE
    WHEN EXISTS (
      SELECT 1
      FROM candidates c
      WHERE LOWER(TRIM(c.candidate_first_name)) = LOWER(TRIM(d1_people.firstname))
        AND LOWER(TRIM(c.candidate_last_name)) = LOWER(TRIM(d1_people.lastname))
        AND c.election_year = 2026
    ) THEN 1
    ELSE is_2026_candidate
  END,
  updated_at = CURRENT_TIMESTAMP
WHERE filer_entity_number IS NULL;

-- Candidate-only people.
INSERT OR IGNORE INTO d1_people (
  filer_entity_number,
  firstname,
  lastname,
  display_name,
  slug,
  party,
  email,
  website_url,
  photo_url,
  is_2026_candidate,
  is_free_stater,
  source,
  updated_at
)
SELECT
  c.filer_entity_number,
  c.candidate_first_name,
  c.candidate_last_name,
  TRIM(COALESCE(c.candidate_first_name, '') || ' ' || COALESCE(c.candidate_last_name, '')),
  LOWER(
    REPLACE(
      REPLACE(
        REPLACE(
          COALESCE(NULLIF(c.slug, ''), c.filer_entity_number || '-' || c.candidate_first_name || '-' || c.candidate_last_name),
          ' ', '-'
        ),
        '''',
        ''
      ),
      '.',
      ''
    )
  ),
  c.political_party,
  c.candidate_email,
  c.candidate_website,
  c.photo_url,
  CASE WHEN c.election_year = 2026 THEN 1 ELSE 0 END,
  CASE
    WHEN LOWER(CAST(COALESCE(c.is_free_stater, '') AS TEXT)) IN ('1', 'true', 'yes') THEN 1
    ELSE 0
  END,
  'candidates',
  CURRENT_TIMESTAMP
FROM candidates c
WHERE NOT EXISTS (
  SELECT 1
  FROM d1_people people
  WHERE people.filer_entity_number = c.filer_entity_number
);

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
  updated_at
)
SELECT
  people.id,
  c.filer_entity_number,
  c.office_type,
  c.office,
  c.county,
  c.district,
  c.political_party,
  COALESCE(c.election_year, 2026),
  c.election_cycle,
  c.total_raised,
  c.total_spent,
  CURRENT_TIMESTAMP
FROM candidates c
JOIN d1_people people
  ON people.filer_entity_number = c.filer_entity_number;

UPDATE d1_people
SET is_2026_candidate = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE is_2026_candidate = 1
  AND NOT EXISTS (
    SELECT 1
    FROM d1_person_candidate_roles roles
    WHERE roles.person_id = d1_people.id
      AND roles.election_year = 2026
  );

-- Unified article-person bridge. Keep the existing candidate/legislator tables
-- for compatibility during the transition, but new code can read this table.
INSERT OR IGNORE INTO d1_article_people (
  article_id,
  person_id,
  relation_type,
  source,
  raw_name
)
SELECT
  al.article_id,
  people.id,
  'mentioned',
  'd1_article_legislators',
  al.legislator_name_raw
FROM d1_article_legislators al
JOIN d1_people people
  ON people.gc_personid = al.personid
  OR people.employeeno = al.employeeno;

INSERT OR IGNORE INTO d1_article_people (
  article_id,
  person_id,
  relation_type,
  source,
  raw_name
)
SELECT
  ac.article_id,
  people.id,
  'mentioned',
  'd1_article_candidates',
  ac.candidate_name_raw
FROM d1_article_candidates ac
JOIN d1_people people
  ON people.filer_entity_number = ac.filer_entity_number;
