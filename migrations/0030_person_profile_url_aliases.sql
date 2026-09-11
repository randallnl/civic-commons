-- Short, shareable alternate paths for unified people profiles.

CREATE TABLE IF NOT EXISTS d1_person_profile_url_aliases (
  alias_slug TEXT NOT NULL COLLATE NOCASE UNIQUE,
  person_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (person_id) REFERENCES d1_people(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_d1_person_profile_url_aliases_person
ON d1_person_profile_url_aliases(person_id);

PRAGMA optimize;
