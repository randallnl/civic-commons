-- Feature flags are intentionally partner-controlled rather than embed-code controlled.
ALTER TABLE partner_trackers
ADD COLUMN show_public_testimony INTEGER NOT NULL DEFAULT 0;

UPDATE partner_trackers
SET
  show_testimony_alignment = 0,
  show_free_state_aligned = 0,
  show_tpaction_aligned = 0,
  show_public_testimony = 0
WHERE is_active = 1;
