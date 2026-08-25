-- Remove CPAC Foundation scorecard entries for people who are not current
-- New Hampshire legislators. This list was audited against d1_people on
-- 2026-08-25 after applying the canonical name aliases in migration 0018.

DELETE FROM organization_endorsements
WHERE organization_slug = 'cpac-foundation'
  AND candidate_name IN (
    'Brian Valerino',
    'Cathy Kenny',
    'Glenn Cordelli',
    'Harry Bean',
    'Jim Creighton',
    'Marie Bjelobrk',
    'Peter Morency',
    'Sandra Panek',
    'Sheila Seidel'
  );
