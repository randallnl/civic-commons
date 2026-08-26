-- Partner-specific legislative tracker and embeddable-widget configuration.
-- The tracker URL is the published Google Sheet CSV used to calculate vote alignment.
CREATE TABLE IF NOT EXISTS partner_trackers (
  partner_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  allowed_origins TEXT NOT NULL DEFAULT '[]',
  bill_tracker_url TEXT NOT NULL,
  widget_version TEXT NOT NULL DEFAULT 'compact' CHECK (widget_version IN ('compact', 'full')),
  show_testimony_alignment INTEGER NOT NULL DEFAULT 1 CHECK (show_testimony_alignment IN (0, 1)),
  show_free_state_aligned INTEGER NOT NULL DEFAULT 0 CHECK (show_free_state_aligned IN (0, 1)),
  show_tpaction_aligned INTEGER NOT NULL DEFAULT 0 CHECK (show_tpaction_aligned IN (0, 1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_partner_trackers_active
ON partner_trackers(active, partner_id);
