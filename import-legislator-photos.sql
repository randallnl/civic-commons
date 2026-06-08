--------------------------------------------------
-- UPDATE PEOPLE PHOTO URLS FROM IMPORTED PHOTO TABLE
--------------------------------------------------

UPDATE people
SET
  photo_url = (
    SELECT p.photo_url
    FROM d1_legislator_photos p
    WHERE p.personid = people.id
    LIMIT 1
  ),
  updated_at = CURRENT_TIMESTAMP
WHERE id IN (
  SELECT personid
  FROM d1_legislator_photos
);