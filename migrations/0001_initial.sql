CREATE TABLE people (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  photo_url TEXT,
  party TEXT,
  email TEXT,
  phone TEXT,
  website_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  level TEXT NOT NULL,
  body TEXT,
  district TEXT,
  division_id INTEGER REFERENCES divisions(id),
  state TEXT DEFAULT 'NH',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE office_terms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id INTEGER NOT NULL,
  position_id INTEGER NOT NULL,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'current',
  source_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (person_id) REFERENCES people(id),
  FOREIGN KEY (position_id) REFERENCES positions(id)
);

CREATE TABLE elections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  election_date TEXT NOT NULL,
  election_type TEXT,
  state TEXT DEFAULT 'NH',
  division_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (division_id) REFERENCES divisions(id)
);

CREATE TABLE candidacies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id INTEGER NOT NULL,
  election_id INTEGER NOT NULL,
  position_id INTEGER NOT NULL,
  party TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  filing_date TEXT,
  campaign_website_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (person_id) REFERENCES people(id),
  FOREIGN KEY (election_id) REFERENCES elections(id),
  FOREIGN KEY (position_id) REFERENCES positions(id)
);

CREATE TABLE polling_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ward TEXT,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  division_id INTEGER NOT NULL,
  notes TEXT,
  source_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (division_id) REFERENCES divisions(id)
);

CREATE TABLE links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  link_type TEXT NOT NULL,
  title TEXT,
  url TEXT NOT NULL,
  publisher TEXT,
  published_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE change_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  field_name TEXT,
  old_value TEXT,
  proposed_value TEXT NOT NULL,
  submitter_name TEXT,
  submitter_email TEXT,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE divisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  type TEXT NOT NULL,
  parent_id INTEGER,
  state TEXT DEFAULT 'NH',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP, 
  "county" TEXT, 
  "district" INTEGER, 
  "towns_represented" TEXT, 
  "floterial" TEXT, 
  "seats" INTEGER,
  FOREIGN KEY (parent_id) REFERENCES divisions(id),
  UNIQUE(type, slug, parent_id)
);

CREATE TABLE bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_year INTEGER NOT NULL,
  bill_number TEXT NOT NULL,
  title TEXT,
  summary TEXT,
  status TEXT,
  general_court_url TEXT,
  legiscan_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_year, bill_number)
);

CREATE TABLE roll_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER NOT NULL,
  chamber TEXT NOT NULL,
  vote_date TEXT,
  motion TEXT,
  result TEXT,
  source_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bill_id) REFERENCES bills(id)
);

CREATE TABLE legislator_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roll_call_id INTEGER NOT NULL,
  person_id INTEGER NOT NULL,
  vote TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (roll_call_id) REFERENCES roll_calls(id),
  FOREIGN KEY (person_id) REFERENCES people(id),
  UNIQUE(roll_call_id, person_id)
);

CREATE TABLE organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  website_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL,
  source_id INTEGER NOT NULL,
  relationship_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_divisions_slug
ON divisions(slug);