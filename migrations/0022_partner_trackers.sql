-- Extend the existing partner tracker registry with embeddable-widget controls.
-- tracker_url is the published Google Sheet CSV used to calculate vote alignment.
CREATE TABLE IF NOT EXISTS partner_trackers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_key TEXT NOT NULL UNIQUE,
  partner_name TEXT NOT NULL,
  tracker_url TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE partner_trackers ADD COLUMN allowed_origins TEXT NOT NULL DEFAULT '[]';
ALTER TABLE partner_trackers ADD COLUMN widget_version TEXT NOT NULL DEFAULT 'compact';
ALTER TABLE partner_trackers ADD COLUMN show_testimony_alignment INTEGER NOT NULL DEFAULT 1;
ALTER TABLE partner_trackers ADD COLUMN show_free_state_aligned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE partner_trackers ADD COLUMN show_tpaction_aligned INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_partner_trackers_active
ON partner_trackers(is_active, partner_key);
