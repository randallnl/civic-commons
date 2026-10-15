-- Repair two NHLA rating records whose candidate slugs predated canonical
-- profile consolidation. Both people already carry the 2026 alignment flag
-- and are included in the people-based Free State Aligned directory.

UPDATE organization_endorsements
SET candidate_name = 'Katelyn Kuttab',
    candidate_slug = 'katelyn-kuttab',
    candidate_slug_key = 'katelyn-kuttab',
    updated_at = CURRENT_TIMESTAMP
WHERE organization_slug = 'new-hampshire-liberty-alliance'
  AND election_year = '2026'
  AND candidate_slug_key = 'katelyn-kuttab-10695';

UPDATE organization_endorsements
SET candidate_name = 'Matt Sabourin dit Choinière',
    candidate_slug = 'matt-sabourin-dit-choiniere',
    candidate_slug_key = 'matt-sabourin-dit-choiniere',
    updated_at = CURRENT_TIMESTAMP
WHERE organization_slug = 'new-hampshire-liberty-alliance'
  AND election_year = '2026'
  AND candidate_slug_key = 'matt-sabourin-dit-choiniere-11420';

INSERT INTO d1_person_profile_url_aliases (
  alias_slug, person_id, created_at, updated_at
)
VALUES
  ('katelyn-kuttab-10695', 259, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('matt-sabourin-dit-choiniere-11420', 402, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(alias_slug) DO UPDATE SET
  person_id = excluded.person_id,
  updated_at = CURRENT_TIMESTAMP;

PRAGMA optimize;
