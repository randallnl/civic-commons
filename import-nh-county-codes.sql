-- Import NH General Court county codes into D1.
-- Source: NHLegislatureDB.dbo.County via public ODBC access.
-- Fetched 2026-06-08.

CREATE TABLE IF NOT EXISTS county_codes (
  code TEXT PRIMARY KEY,
  name TEXT,
  abbreviation TEXT,
  source_county_id INTEGER NOT NULL UNIQUE,
  source_timestamp TEXT,
  source_table TEXT NOT NULL DEFAULT 'NHLegislatureDB.dbo.County',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO county_codes (
  code,
  name,
  abbreviation,
  source_county_id,
  source_timestamp,
  updated_at
)
VALUES
  ('01', 'Belknap', 'Belk.', 1, '2015-03-18 15:53:11', CURRENT_TIMESTAMP),
  ('02', 'Carroll', 'Carr.', 2, '2015-03-18 15:53:26', CURRENT_TIMESTAMP),
  ('03', 'Cheshire', 'Ches.', 3, '2015-03-18 15:53:38', CURRENT_TIMESTAMP),
  ('04', 'Coos', 'Coos', 4, '2015-03-18 15:53:48', CURRENT_TIMESTAMP),
  ('05', 'Grafton', 'Graf.', 5, '2015-03-18 15:53:59', CURRENT_TIMESTAMP),
  ('06', 'Hillsborough', 'Hills.', 6, '2015-03-18 15:54:11', CURRENT_TIMESTAMP),
  ('07', 'Merrimack', 'Merr.', 7, '2015-03-18 15:54:21', CURRENT_TIMESTAMP),
  ('08', 'Rockingham', 'Rock.', 8, '2015-03-18 15:54:31', CURRENT_TIMESTAMP),
  ('09', 'Strafford', 'Straf.', 9, '2015-03-18 15:54:45', CURRENT_TIMESTAMP),
  ('10', 'Sullivan', 'Sull.', 10, '2015-03-18 15:55:06', CURRENT_TIMESTAMP),
  ('11', NULL, NULL, 11, '2015-09-13 00:00:00', CURRENT_TIMESTAMP)
ON CONFLICT(code) DO UPDATE SET
  name = excluded.name,
  abbreviation = excluded.abbreviation,
  source_county_id = excluded.source_county_id,
  source_timestamp = excluded.source_timestamp,
  updated_at = CURRENT_TIMESTAMP;

