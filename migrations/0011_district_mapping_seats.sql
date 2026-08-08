ALTER TABLE d1_district_mapping
ADD COLUMN seats INTEGER;

UPDATE d1_district_mapping
SET seats = (
  SELECT divisions.seats
  FROM divisions
  LEFT JOIN county_codes
    ON LOWER(county_codes.name) = LOWER(divisions.county)
  WHERE divisions.type = 'house_district'
    AND d1_district_mapping.body = 'H'
    AND d1_district_mapping.county = county_codes.source_county_id
    AND d1_district_mapping.district = divisions.district
  LIMIT 1
)
WHERE body = 'H';
