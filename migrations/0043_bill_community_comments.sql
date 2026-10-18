ALTER TABLE community_updates
ADD COLUMN content_type TEXT NOT NULL DEFAULT 'community_comment';

ALTER TABLE community_updates
ADD COLUMN bill_position TEXT;

ALTER TABLE community_updates
ADD COLUMN statement_format TEXT;

CREATE INDEX IF NOT EXISTS idx_community_update_mentions_person
ON community_update_mentions(person_id, update_id);

CREATE INDEX IF NOT EXISTS idx_community_updates_bill_comments
ON community_updates(entity_type, entity_key, status, bill_position, created_at);
