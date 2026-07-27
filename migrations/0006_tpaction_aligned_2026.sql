ALTER TABLE d1_people ADD COLUMN is_tpaction_aligned_2026 INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_d1_people_tpaction_aligned_2026
ON d1_people(is_tpaction_aligned_2026, is_current_legislator, is_2026_candidate);
