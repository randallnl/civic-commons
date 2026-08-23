ALTER TABLE d1_district_mapping
ADD COLUMN counties_represented TEXT;

UPDATE d1_district_mapping
SET counties_represented = CASE district
  WHEN 1 THEN 'Coos, Grafton'
  WHEN 2 THEN 'Belknap, Carroll, Grafton'
  WHEN 3 THEN 'Carroll, Coos, Grafton, Strafford'
  WHEN 4 THEN 'Strafford'
  WHEN 5 THEN 'Grafton, Merrimack, Sullivan'
  WHEN 6 THEN 'Belknap, Strafford'
  WHEN 7 THEN 'Belknap, Grafton, Hillsborough, Sullivan, Merrimack'
  WHEN 8 THEN 'Cheshire, Merrimack, Hillsborough, Sullivan'
  WHEN 9 THEN 'Cheshire, Hillsborough'
  WHEN 10 THEN 'Cheshire, Hillsborough'
  WHEN 11 THEN 'Hillsborough'
  WHEN 12 THEN 'Cheshire, Hillsborough'
  WHEN 13 THEN 'Hillsborough'
  WHEN 14 THEN 'Hillsborough, Rockingham'
  WHEN 15 THEN 'Merrimack'
  WHEN 16 THEN 'Hillsborough, Merrimack, Rockingham'
  WHEN 17 THEN 'Belknap, Merrimack, Rockingham'
  WHEN 18 THEN 'Hillsborough'
  WHEN 19 THEN 'Rockingham'
  WHEN 20 THEN 'Hillsborough'
  WHEN 21 THEN 'Rockingham, Strafford'
  WHEN 22 THEN 'Hillsborough, Rockingham'
  WHEN 23 THEN 'Rockingham'
  WHEN 24 THEN 'Rockingham'
  ELSE counties_represented
END,
updated_at = CURRENT_TIMESTAMP
WHERE body = 'S';
