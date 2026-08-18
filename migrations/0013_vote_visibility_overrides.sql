CREATE TABLE IF NOT EXISTS d1_vote_visibility_overrides (
  sessionyear INTEGER NOT NULL,
  legislativebody TEXT NOT NULL,
  votesequencenumber INTEGER NOT NULL,
  condensedbillno TEXT NOT NULL,
  include_in_display INTEGER NOT NULL DEFAULT 1,
  include_in_grades INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  updated_by TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (
    sessionyear,
    legislativebody,
    votesequencenumber,
    condensedbillno
  )
);

CREATE INDEX IF NOT EXISTS idx_vote_visibility_bill
ON d1_vote_visibility_overrides(sessionyear, condensedbillno);
