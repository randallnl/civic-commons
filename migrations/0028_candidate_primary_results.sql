CREATE TABLE IF NOT EXISTS d1_candidate_primary_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id INTEGER NOT NULL,
  candidate_role_id INTEGER NOT NULL,
  filer_entity_number TEXT NOT NULL,
  election_year INTEGER NOT NULL,
  election_date TEXT NOT NULL,
  election_type TEXT NOT NULL DEFAULT 'primary',
  party TEXT,
  office TEXT,
  county TEXT,
  district TEXT,
  outcome TEXT NOT NULL,
  votes_received INTEGER,
  vote_percentage REAL,
  total_contest_votes INTEGER,
  seats_available INTEGER,
  external_race_id TEXT,
  result_status TEXT,
  source_url TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'Associated Press via NHPR',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (person_id) REFERENCES d1_people(id),
  FOREIGN KEY (candidate_role_id) REFERENCES d1_person_candidate_roles(id),
  UNIQUE(filer_entity_number, election_date, election_type)
);

CREATE INDEX IF NOT EXISTS idx_d1_candidate_primary_results_person
ON d1_candidate_primary_results(person_id, election_year, outcome);

CREATE INDEX IF NOT EXISTS idx_d1_candidate_primary_results_role
ON d1_candidate_primary_results(candidate_role_id);

