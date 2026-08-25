-- Privacy-conscious daily traffic totals for canonical people profiles.
-- Browser identifiers are hashed with the profile and date before storage, so
-- they cannot be used to follow a visitor across profiles or across days.

CREATE TABLE IF NOT EXISTS d1_profile_view_daily (
  person_id INTEGER NOT NULL,
  view_date TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  first_viewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_viewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (person_id, view_date),
  FOREIGN KEY (person_id) REFERENCES d1_people(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_d1_profile_view_daily_date
ON d1_profile_view_daily(view_date DESC);

CREATE TABLE IF NOT EXISTS d1_profile_view_visitors (
  person_id INTEGER NOT NULL,
  view_date TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (person_id, view_date, visitor_hash),
  FOREIGN KEY (person_id) REFERENCES d1_people(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_d1_profile_view_visitors_date
ON d1_profile_view_visitors(view_date DESC);
