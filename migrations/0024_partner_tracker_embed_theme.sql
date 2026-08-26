ALTER TABLE partner_trackers ADD COLUMN embed_accent_color TEXT NOT NULL DEFAULT '#1d4ed8';
ALTER TABLE partner_trackers ADD COLUMN embed_accent_soft_color TEXT NOT NULL DEFAULT '#e0e7ff';
ALTER TABLE partner_trackers ADD COLUMN embed_alignment_label TEXT NOT NULL DEFAULT 'Tracker aligned';
ALTER TABLE partner_trackers ADD COLUMN embed_vote_intro TEXT NOT NULL DEFAULT 'What this vote means';

UPDATE partner_trackers
SET
  embed_accent_color = '#3b5f8c',
  embed_accent_soft_color = '#e8f0f7',
  embed_alignment_label = 'Aligned with ABLE NH’s tracked priorities',
  embed_vote_intro = 'What this vote means for disability justice'
WHERE lower(partner_key) = 'able-nh';
