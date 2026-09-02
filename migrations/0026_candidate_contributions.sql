CREATE TABLE IF NOT EXISTS d1_candidate_contributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id INTEGER,
  filer_entity_number TEXT NOT NULL,
  election_year INTEGER NOT NULL DEFAULT 2026,
  contributor_name TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  contribution_date TEXT,
  contributor_type TEXT,
  contributor_city TEXT,
  contributor_state TEXT,
  source_filing_id TEXT,
  source_url TEXT,
  source TEXT NOT NULL DEFAULT 'NH Secretary of State campaign finance filing',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (person_id) REFERENCES d1_people(id)
);

CREATE INDEX IF NOT EXISTS idx_d1_candidate_contributions_candidate
ON d1_candidate_contributions(filer_entity_number, election_year, amount DESC);

CREATE INDEX IF NOT EXISTS idx_d1_candidate_contributions_person
ON d1_candidate_contributions(person_id, election_year, amount DESC);
