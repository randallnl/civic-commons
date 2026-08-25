-- Connect scorecard and endorsement names to their canonical people records.
-- Each update is idempotent and preserves any aliases already stored.

UPDATE d1_people
SET name_aliases = CASE
  WHEN instr(lower(COALESCE(name_aliases, '')), lower('Charles Melvin')) > 0 THEN name_aliases
  WHEN trim(COALESCE(name_aliases, '')) = '' THEN 'Charles Melvin'
  ELSE name_aliases || ', Charles Melvin'
END
WHERE gc_personid = 8419;

UPDATE d1_people
SET name_aliases = CASE
  WHEN instr(lower(COALESCE(name_aliases, '')), lower('Matt Sabourin')) > 0 THEN name_aliases
  WHEN trim(COALESCE(name_aliases, '')) = '' THEN 'Matt Sabourin'
  ELSE name_aliases || ', Matt Sabourin'
END
WHERE gc_personid = 11420;

UPDATE d1_people
SET name_aliases = CASE
  WHEN instr(lower(COALESCE(name_aliases, '')), lower('Pamela Brown')) > 0 THEN name_aliases
  WHEN trim(COALESCE(name_aliases, '')) = '' THEN 'Pamela Brown'
  ELSE name_aliases || ', Pamela Brown'
END
WHERE gc_personid = 11407;

UPDATE d1_people
SET name_aliases = CASE
  WHEN instr(lower(COALESCE(name_aliases, '')), lower('Richard Nalevanko')) > 0 THEN name_aliases
  WHEN trim(COALESCE(name_aliases, '')) = '' THEN 'Richard Nalevanko'
  ELSE name_aliases || ', Richard Nalevanko'
END
WHERE gc_personid = 10030;

UPDATE d1_people
SET name_aliases = CASE
  WHEN instr(lower(COALESCE(name_aliases, '')), lower('Riche Colcombe')) > 0 THEN name_aliases
  WHEN trim(COALESCE(name_aliases, '')) = '' THEN 'Riche Colcombe'
  ELSE name_aliases || ', Riche Colcombe'
END
WHERE gc_personid = 10099;

UPDATE d1_people
SET name_aliases = CASE
  WHEN instr(lower(COALESCE(name_aliases, '')), lower('Roderick Ladd')) > 0 THEN name_aliases
  WHEN trim(COALESCE(name_aliases, '')) = '' THEN 'Roderick Ladd'
  ELSE name_aliases || ', Roderick Ladd'
END
WHERE gc_personid = 582;

UPDATE d1_people
SET name_aliases = CASE
  WHEN instr(lower(COALESCE(name_aliases, '')), lower('Leonard Turcotte')) > 0 THEN name_aliases
  WHEN trim(COALESCE(name_aliases, '')) = '' THEN 'Leonard Turcotte'
  ELSE name_aliases || ', Leonard Turcotte'
END
WHERE gc_personid = 920;
