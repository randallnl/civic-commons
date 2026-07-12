CREATE TABLE IF NOT EXISTS admin_candidate_legislator_links (
  candidate_filer_entity_number TEXT PRIMARY KEY,
  representative_personid INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_candidate_legislator_links_representative
ON admin_candidate_legislator_links(representative_personid);
