-- Durable metadata for candidate and legislator social graphics rendered by
-- the external Content Generator. The PNG remains owned by that service.

CREATE TABLE IF NOT EXISTS content_graphic_events (
  local_event_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('candidate', 'legislator')),
  entity_id TEXT NOT NULL,
  candidate_id TEXT,
  legislator_id TEXT,
  template_slug TEXT NOT NULL,
  renderer_render_id TEXT,
  variation_id TEXT,
  variation_name TEXT,
  image_url TEXT,
  source_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  request_json TEXT NOT NULL,
  renderer_duplicate INTEGER NOT NULL DEFAULT 0,
  error_summary TEXT,
  renderer_request_id TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_content_graphic_events_entity
ON content_graphic_events(entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_graphic_events_status
ON content_graphic_events(status, updated_at DESC);
