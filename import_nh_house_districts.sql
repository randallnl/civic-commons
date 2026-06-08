-- Import NH House districts into divisions
-- This assumes county divisions already exist with type='county'.

DELETE FROM divisions WHERE type = 'house_district';

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Belknap 1',
  'belknap-1',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Belknap County' OR county = 'Belknap' OR slug = 'belknap')
    LIMIT 1
  ),
  'NH',
  'Belknap',
  1,
  1,
  'Center Harbor; New Hampton',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Belknap 2',
  'belknap-2',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Belknap County' OR county = 'Belknap' OR slug = 'belknap')
    LIMIT 1
  ),
  'NH',
  'Belknap',
  2,
  2,
  'Meredith',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Belknap 3',
  'belknap-3',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Belknap County' OR county = 'Belknap' OR slug = 'belknap')
    LIMIT 1
  ),
  'NH',
  'Belknap',
  3,
  1,
  'Sanbornton; Tilton',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Belknap 4',
  'belknap-4',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Belknap County' OR county = 'Belknap' OR slug = 'belknap')
    LIMIT 1
  ),
  'NH',
  'Belknap',
  4,
  1,
  'Belmont',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Belknap 5',
  'belknap-5',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Belknap County' OR county = 'Belknap' OR slug = 'belknap')
    LIMIT 1
  ),
  'NH',
  'Belknap',
  5,
  4,
  'Laconia Ward 1; Laconia Ward 3; Laconia Ward 4; Laconia Ward 5; Laconia Ward 6',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Belknap 6',
  'belknap-6',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Belknap County' OR county = 'Belknap' OR slug = 'belknap')
    LIMIT 1
  ),
  'NH',
  'Belknap',
  6,
  4,
  'Gilford; Gilmanton; Laconia Ward 2',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Belknap 7',
  'belknap-7',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Belknap County' OR county = 'Belknap' OR slug = 'belknap')
    LIMIT 1
  ),
  'NH',
  'Belknap',
  7,
  3,
  'Alton; Barnstead',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Belknap 8',
  'belknap-8',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Belknap County' OR county = 'Belknap' OR slug = 'belknap')
    LIMIT 1
  ),
  'NH',
  'Belknap',
  8,
  2,
  'Belmont; Sanbornton; Tilton',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Carroll 1',
  'carroll-1',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Carroll County' OR county = 'Carroll' OR slug = 'carroll')
    LIMIT 1
  ),
  'NH',
  'Carroll',
  1,
  3,
  'Conway',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Carroll 2',
  'carroll-2',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Carroll County' OR county = 'Carroll' OR slug = 'carroll')
    LIMIT 1
  ),
  'NH',
  'Carroll',
  2,
  2,
  'Albany; Bartlett; Chatham; Hale''s Location; Hart''s Location; Jackson; Madison',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Carroll 3',
  'carroll-3',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Carroll County' OR county = 'Carroll' OR slug = 'carroll')
    LIMIT 1
  ),
  'NH',
  'Carroll',
  3,
  2,
  'Madison; Moultonborough; Tamworth',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Carroll 4',
  'carroll-4',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Carroll County' OR county = 'Carroll' OR slug = 'carroll')
    LIMIT 1
  ),
  'NH',
  'Carroll',
  4,
  2,
  'Brookfield; Eaton; Effingham; Freedom; Wakefield',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Carroll 5',
  'carroll-5',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Carroll County' OR county = 'Carroll' OR slug = 'carroll')
    LIMIT 1
  ),
  'NH',
  'Carroll',
  5,
  1,
  'Ossipee',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Carroll 6',
  'carroll-6',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Carroll County' OR county = 'Carroll' OR slug = 'carroll')
    LIMIT 1
  ),
  'NH',
  'Carroll',
  6,
  2,
  'Tuftonboro; Wolfeboro',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Carroll 7',
  'carroll-7',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Carroll County' OR county = 'Carroll' OR slug = 'carroll')
    LIMIT 1
  ),
  'NH',
  'Carroll',
  7,
  1,
  'Ossipee; Tuftonboro; Wolfeboro',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Carroll 8',
  'carroll-8',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Carroll County' OR county = 'Carroll' OR slug = 'carroll')
    LIMIT 1
  ),
  'NH',
  'Carroll',
  8,
  2,
  'Brookfield; Eaton; Effingham; Freedom; Madison; Moultonborough; Tamworth; Wakefield',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Cheshire 1',
  'cheshire-1',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Cheshire County' OR county = 'Cheshire' OR slug = 'cheshire')
    LIMIT 1
  ),
  'NH',
  'Cheshire',
  1,
  1,
  'Keene Ward 1',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Cheshire 2',
  'cheshire-2',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Cheshire County' OR county = 'Cheshire' OR slug = 'cheshire')
    LIMIT 1
  ),
  'NH',
  'Cheshire',
  2,
  1,
  'Keene Ward 3',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Cheshire 3',
  'cheshire-3',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Cheshire County' OR county = 'Cheshire' OR slug = 'cheshire')
    LIMIT 1
  ),
  'NH',
  'Cheshire',
  3,
  1,
  'Keene Ward 5',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Cheshire 4',
  'cheshire-4',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Cheshire County' OR county = 'Cheshire' OR slug = 'cheshire')
    LIMIT 1
  ),
  'NH',
  'Cheshire',
  4,
  1,
  'Keene Ward 4',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Cheshire 5',
  'cheshire-5',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Cheshire County' OR county = 'Cheshire' OR slug = 'cheshire')
    LIMIT 1
  ),
  'NH',
  'Cheshire',
  5,
  1,
  'Surry',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Cheshire 6',
  'cheshire-6',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Cheshire County' OR county = 'Cheshire' OR slug = 'cheshire')
    LIMIT 1
  ),
  'NH',
  'Cheshire',
  6,
  2,
  'Chesterfield; Hinsdale; Surry; Walpole; Westmoreland',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Cheshire 7',
  'cheshire-7',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Cheshire County' OR county = 'Cheshire' OR slug = 'cheshire')
    LIMIT 1
  ),
  'NH',
  'Cheshire',
  7,
  1,
  'Keene Ward 2',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Cheshire 8',
  'cheshire-8',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Cheshire County' OR county = 'Cheshire' OR slug = 'cheshire')
    LIMIT 1
  ),
  'NH',
  'Cheshire',
  8,
  1,
  'Harrisville; Marlborough; Nelson; Roxbury; Sullivan',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Cheshire 9',
  'cheshire-9',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Cheshire County' OR county = 'Cheshire' OR slug = 'cheshire')
    LIMIT 1
  ),
  'NH',
  'Cheshire',
  9,
  1,
  'Alstead; Gilsum; Marlow; Stoddard',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Cheshire 10',
  'cheshire-10',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Cheshire County' OR county = 'Cheshire' OR slug = 'cheshire')
    LIMIT 1
  ),
  'NH',
  'Cheshire',
  10,
  2,
  'Richmond; Swanzey',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Cheshire 11',
  'cheshire-11',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Cheshire County' OR county = 'Cheshire' OR slug = 'cheshire')
    LIMIT 1
  ),
  'NH',
  'Cheshire',
  11,
  1,
  'Winchester',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Cheshire 12',
  'cheshire-12',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Cheshire County' OR county = 'Cheshire' OR slug = 'cheshire')
    LIMIT 1
  ),
  'NH',
  'Cheshire',
  12,
  1,
  'Fitzwilliam; Troy',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Cheshire 13',
  'cheshire-13',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Cheshire County' OR county = 'Cheshire' OR slug = 'cheshire')
    LIMIT 1
  ),
  'NH',
  'Cheshire',
  13,
  1,
  'Dublin; Jaffrey',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Cheshire 14',
  'cheshire-14',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Cheshire County' OR county = 'Cheshire' OR slug = 'cheshire')
    LIMIT 1
  ),
  'NH',
  'Cheshire',
  14,
  1,
  'Rindge',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Cheshire 15',
  'cheshire-15',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Cheshire County' OR county = 'Cheshire' OR slug = 'cheshire')
    LIMIT 1
  ),
  'NH',
  'Cheshire',
  15,
  2,
  'Chesterfield; Hinsdale; Keene Ward 1; Keene Ward 3; Keene Ward 4; Keene Ward 5; Surry; Walpole; Westmoreland',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Cheshire 16',
  'cheshire-16',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Cheshire County' OR county = 'Cheshire' OR slug = 'cheshire')
    LIMIT 1
  ),
  'NH',
  'Cheshire',
  16,
  1,
  'Alstead; Gilsum; Harrisville; Keene Ward 2; Marlborough; Marlow; Nelson; Roxbury; Stoddard; Sullivan',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Cheshire 17',
  'cheshire-17',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Cheshire County' OR county = 'Cheshire' OR slug = 'cheshire')
    LIMIT 1
  ),
  'NH',
  'Cheshire',
  17,
  1,
  'Fitzwilliam; Richmond; Swanzey; Troy; Winchester',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Cheshire 18',
  'cheshire-18',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Cheshire County' OR county = 'Cheshire' OR slug = 'cheshire')
    LIMIT 1
  ),
  'NH',
  'Cheshire',
  18,
  2,
  'Dublin; Jaffrey; Rindge',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Coos 1',
  'coos-1',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Coos County' OR county = 'Coos' OR slug = 'coos')
    LIMIT 1
  ),
  'NH',
  'Coos',
  1,
  2,
  'Dalton; Lancaster; Northumberland; Stratford',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Coos 2',
  'coos-2',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Coos County' OR county = 'Coos' OR slug = 'coos')
    LIMIT 1
  ),
  'NH',
  'Coos',
  2,
  1,
  'Atkinson and Gilmanton Academy Grant; Cambridge; Clarksville; Dix''s Grant; Dixville; Dummer; Errol; Milan; Millsfield; Odell; Pittsburg; Second College Grant; Stark; Wentworth''s Location',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Coos 3',
  'coos-3',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Coos County' OR county = 'Coos' OR slug = 'coos')
    LIMIT 1
  ),
  'NH',
  'Coos',
  3,
  1,
  'Colebrook; Columbia; Erving''s Location; Stewartstown',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Coos 4',
  'coos-4',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Coos County' OR county = 'Coos' OR slug = 'coos')
    LIMIT 1
  ),
  'NH',
  'Coos',
  4,
  1,
  'Carroll; Jefferson; Kilkenny; Whitefield',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Coos 5',
  'coos-5',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Coos County' OR county = 'Coos' OR slug = 'coos')
    LIMIT 1
  ),
  'NH',
  'Coos',
  5,
  2,
  'Berlin',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Coos 6',
  'coos-6',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Coos County' OR county = 'Coos' OR slug = 'coos')
    LIMIT 1
  ),
  'NH',
  'Coos',
  6,
  1,
  'Bean''s Grant; Bean''s Purchase; Chandler''s Purchase; Crawford''s Purchase; Cutt''s Grant; Gorham; Green''s Grant; Hadley''s Purchase; Low and Burbank''s Grant; Martin''s Location; Pinkham''s Grant; Randolph; Sargent''s Purchase; Shelburne; Success; Thompson and Meserve''s Purchase',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Coos 7',
  'coos-7',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Coos County' OR county = 'Coos' OR slug = 'coos')
    LIMIT 1
  ),
  'NH',
  'Coos',
  7,
  1,
  'Berlin; Carroll; Jefferson; Kilkenny; Whitefield',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Grafton 1',
  'grafton-1',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Grafton County' OR county = 'Grafton' OR slug = 'grafton')
    LIMIT 1
  ),
  'NH',
  'Grafton',
  1,
  3,
  'Bath; Lisbon; Littleton; Lyman; Monroe; Sugar Hill',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Grafton 2',
  'grafton-2',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Grafton County' OR county = 'Grafton' OR slug = 'grafton')
    LIMIT 1
  ),
  'NH',
  'Grafton',
  2,
  1,
  'Bethlehem; Franconia',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Grafton 3',
  'grafton-3',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Grafton County' OR county = 'Grafton' OR slug = 'grafton')
    LIMIT 1
  ),
  'NH',
  'Grafton',
  3,
  1,
  'Easton; Lincoln; Livermore; Woodstock',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Grafton 4',
  'grafton-4',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Grafton County' OR county = 'Grafton' OR slug = 'grafton')
    LIMIT 1
  ),
  'NH',
  'Grafton',
  4,
  1,
  'Ellsworth; Thornton; Waterville Valley',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Grafton 5',
  'grafton-5',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Grafton County' OR county = 'Grafton' OR slug = 'grafton')
    LIMIT 1
  ),
  'NH',
  'Grafton',
  5,
  2,
  'Benton; Haverhill; Landaff; Piermont; Warren',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Grafton 6',
  'grafton-6',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Grafton County' OR county = 'Grafton' OR slug = 'grafton')
    LIMIT 1
  ),
  'NH',
  'Grafton',
  6,
  1,
  'Orford; Rumney; Wentworth',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Grafton 7',
  'grafton-7',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Grafton County' OR county = 'Grafton' OR slug = 'grafton')
    LIMIT 1
  ),
  'NH',
  'Grafton',
  7,
  1,
  'Campton',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Grafton 8',
  'grafton-8',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Grafton County' OR county = 'Grafton' OR slug = 'grafton')
    LIMIT 1
  ),
  'NH',
  'Grafton',
  8,
  3,
  'Ashland; Holderness; Plymouth',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Grafton 9',
  'grafton-9',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Grafton County' OR county = 'Grafton' OR slug = 'grafton')
    LIMIT 1
  ),
  'NH',
  'Grafton',
  9,
  1,
  'Canaan; Dorchester; Orange',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Grafton 10',
  'grafton-10',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Grafton County' OR county = 'Grafton' OR slug = 'grafton')
    LIMIT 1
  ),
  'NH',
  'Grafton',
  10,
  1,
  'Bridgewater; Bristol',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Grafton 11',
  'grafton-11',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Grafton County' OR county = 'Grafton' OR slug = 'grafton')
    LIMIT 1
  ),
  'NH',
  'Grafton',
  11,
  1,
  'Alexandria; Grafton; Groton; Hebron',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Grafton 12',
  'grafton-12',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Grafton County' OR county = 'Grafton' OR slug = 'grafton')
    LIMIT 1
  ),
  'NH',
  'Grafton',
  12,
  4,
  'Hanover; Lyme',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Grafton 13',
  'grafton-13',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Grafton County' OR county = 'Grafton' OR slug = 'grafton')
    LIMIT 1
  ),
  'NH',
  'Grafton',
  13,
  1,
  'Lebanon Ward 1',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Grafton 14',
  'grafton-14',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Grafton County' OR county = 'Grafton' OR slug = 'grafton')
    LIMIT 1
  ),
  'NH',
  'Grafton',
  14,
  1,
  'Lebanon Ward 2',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Grafton 15',
  'grafton-15',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Grafton County' OR county = 'Grafton' OR slug = 'grafton')
    LIMIT 1
  ),
  'NH',
  'Grafton',
  15,
  1,
  'Lebanon Ward 3',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Grafton 16',
  'grafton-16',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Grafton County' OR county = 'Grafton' OR slug = 'grafton')
    LIMIT 1
  ),
  'NH',
  'Grafton',
  16,
  1,
  'Enfield',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Grafton 17',
  'grafton-17',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Grafton County' OR county = 'Grafton' OR slug = 'grafton')
    LIMIT 1
  ),
  'NH',
  'Grafton',
  17,
  1,
  'Lebanon Ward 1; Lebanon Ward 2; Lebanon Ward 3',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Grafton 18',
  'grafton-18',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Grafton County' OR county = 'Grafton' OR slug = 'grafton')
    LIMIT 1
  ),
  'NH',
  'Grafton',
  18,
  1,
  'Alexandria; Bridgewater; Bristol; Canaan; Dorchester; Enfield; Grafton; Groton; Hebron; Orange',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 1',
  'hillsborough-1',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  1,
  4,
  'Pelham',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 2',
  'hillsborough-2',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  2,
  7,
  'Bedford',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 3',
  'hillsborough-3',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  3,
  3,
  'Nashua Ward 4',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 4',
  'hillsborough-4',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  4,
  3,
  'Nashua Ward 2',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 5',
  'hillsborough-5',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  5,
  3,
  'Nashua Ward 1',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 6',
  'hillsborough-6',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  6,
  3,
  'Nashua Ward 3',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 7',
  'hillsborough-7',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  7,
  3,
  'Nashua Ward 7',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 8',
  'hillsborough-8',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  8,
  3,
  'Nashua Ward 6',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 9',
  'hillsborough-9',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  9,
  3,
  'Nashua Ward 5',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 10',
  'hillsborough-10',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  10,
  3,
  'Nashua Ward 9',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 11',
  'hillsborough-11',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  11,
  3,
  'Nashua Ward 8',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 12',
  'hillsborough-12',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  12,
  8,
  'Merrimack',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 13',
  'hillsborough-13',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  13,
  6,
  'Hudson',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 14',
  'hillsborough-14',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  14,
  2,
  'Litchfield',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 15',
  'hillsborough-15',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  15,
  2,
  'Manchester Ward 8',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 16',
  'hillsborough-16',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  16,
  2,
  'Manchester Ward 6',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 17',
  'hillsborough-17',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  17,
  2,
  'Manchester Ward 2',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 18',
  'hillsborough-18',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  18,
  2,
  'Manchester Ward 12',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 19',
  'hillsborough-19',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  19,
  2,
  'Manchester Ward 10',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 20',
  'hillsborough-20',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  20,
  2,
  'Manchester Ward 9',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 21',
  'hillsborough-21',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  21,
  2,
  'Manchester Ward 1',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 22',
  'hillsborough-22',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  22,
  2,
  'Manchester Ward 11',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 23',
  'hillsborough-23',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  23,
  2,
  'Manchester Ward 3',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 24',
  'hillsborough-24',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  24,
  2,
  'Manchester Ward 4',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 25',
  'hillsborough-25',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  25,
  2,
  'Manchester Ward 5',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 26',
  'hillsborough-26',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  26,
  2,
  'Manchester Ward 7',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 27',
  'hillsborough-27',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  27,
  1,
  'Deering; Francestown',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 28',
  'hillsborough-28',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  28,
  2,
  'Weare',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 29',
  'hillsborough-29',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  29,
  4,
  'Goffstown',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 30',
  'hillsborough-30',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  30,
  3,
  'Antrim; Bennington; Hillsborough; Windsor',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 31',
  'hillsborough-31',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  31,
  1,
  'Greenfield; Hancock',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 32',
  'hillsborough-32',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  32,
  3,
  'New Ipswich; Temple; Wilton',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 33',
  'hillsborough-33',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  33,
  2,
  'Peterborough; Sharon',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 34',
  'hillsborough-34',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  34,
  3,
  'Amherst',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 35',
  'hillsborough-35',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  35,
  2,
  'Hollis',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 36',
  'hillsborough-36',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  36,
  2,
  'Brookline; Greenville; Mason',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 37',
  'hillsborough-37',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  37,
  1,
  'Amherst; Milford',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 38',
  'hillsborough-38',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  38,
  2,
  'Hudson; Litchfield',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 39',
  'hillsborough-39',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  39,
  2,
  'Manchester Ward 6; Manchester Ward 8; Manchester Ward 9',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 40',
  'hillsborough-40',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  40,
  4,
  'Manchester Ward 1; Manchester Ward 3; Manchester Ward 10; Manchester Ward 11; Manchester Ward 12',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 41',
  'hillsborough-41',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  41,
  3,
  'Manchester Ward 2; Manchester Ward 4; Manchester Ward 5; Manchester Ward 7',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 42',
  'hillsborough-42',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  42,
  3,
  'Lyndeborough; Mont Vernon; New Boston',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 43',
  'hillsborough-43',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  43,
  4,
  'Milford',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 44',
  'hillsborough-44',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  44,
  2,
  'Goffstown; Weare',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Hillsborough 45',
  'hillsborough-45',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Hillsborough County' OR county = 'Hillsborough' OR slug = 'hillsborough')
    LIMIT 1
  ),
  'NH',
  'Hillsborough',
  45,
  1,
  'Brookline; Greenville; Hollis; Mason',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 1',
  'merrimack-1',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  1,
  1,
  'Boscawen',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 2',
  'merrimack-2',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  2,
  1,
  'Northfield',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 3',
  'merrimack-3',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  3,
  2,
  'Franklin Ward 1; Franklin Ward 2; Franklin Ward 3',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 4',
  'merrimack-4',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  4,
  2,
  'Canterbury; Loudon',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 5',
  'merrimack-5',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  5,
  2,
  'Andover; Danbury; Hill; Salisbury; Webster',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 6',
  'merrimack-6',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  6,
  1,
  'Sutton; Wilmot',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 7',
  'merrimack-7',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  7,
  2,
  'New London; Newbury',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 8',
  'merrimack-8',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  8,
  3,
  'Bradford; Henniker; Warner',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 9',
  'merrimack-9',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  9,
  4,
  'Bow; Hopkinton',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 10',
  'merrimack-10',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  10,
  4,
  'Dunbarton; Hooksett',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 11',
  'merrimack-11',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  11,
  1,
  'Allenstown',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 12',
  'merrimack-12',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  12,
  2,
  'Pembroke',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 13',
  'merrimack-13',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  13,
  2,
  'Chichester; Pittsfield',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 14',
  'merrimack-14',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  14,
  1,
  'Epsom',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 15',
  'merrimack-15',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  15,
  1,
  'Concord Ward 1',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 16',
  'merrimack-16',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  16,
  1,
  'Concord Ward 2',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 17',
  'merrimack-17',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  17,
  1,
  'Concord Ward 3',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 18',
  'merrimack-18',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  18,
  1,
  'Concord Ward 4',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 19',
  'merrimack-19',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  19,
  1,
  'Concord Ward 5',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 20',
  'merrimack-20',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  20,
  1,
  'Concord Ward 6',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 21',
  'merrimack-21',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  21,
  1,
  'Concord Ward 7',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 22',
  'merrimack-22',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  22,
  1,
  'Concord Ward 8',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 23',
  'merrimack-23',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  23,
  1,
  'Concord Ward 9',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 24',
  'merrimack-24',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  24,
  1,
  'Concord Ward 10',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 25',
  'merrimack-25',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  25,
  1,
  'Franklin Ward 1; Franklin Ward 2; Franklin Ward 3; Northfield',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 26',
  'merrimack-26',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  26,
  1,
  'Andover; Boscawen; Canterbury; Danbury; Hill; Loudon; Salisbury; Webster',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 27',
  'merrimack-27',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  27,
  2,
  'Allenstown; Dunbarton; Epsom',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 28',
  'merrimack-28',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  28,
  1,
  'Concord Ward 1; Concord Ward 2; Concord Ward 3; Concord Ward 4',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 29',
  'merrimack-29',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  29,
  1,
  'Concord Ward 9; Concord Ward 10',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Merrimack 30',
  'merrimack-30',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Merrimack County' OR county = 'Merrimack' OR slug = 'merrimack')
    LIMIT 1
  ),
  'NH',
  'Merrimack',
  30,
  1,
  'Concord Ward 5; Concord Ward 6; Concord Ward 7; Concord Ward 8',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 1',
  'rockingham-1',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  1,
  3,
  'Northwood; Nottingham',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 2',
  'rockingham-2',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  2,
  3,
  'Auburn; Candia; Deerfield',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 3',
  'rockingham-3',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  3,
  1,
  'Chester',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 4',
  'rockingham-4',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  4,
  3,
  'Raymond',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 5',
  'rockingham-5',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  5,
  2,
  'Epping',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 6',
  'rockingham-6',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  6,
  1,
  'Brentwood',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 7',
  'rockingham-7',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  7,
  1,
  'Fremont',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 8',
  'rockingham-8',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  8,
  1,
  'Danville',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 9',
  'rockingham-9',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  9,
  2,
  'Sandown',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 10',
  'rockingham-10',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  10,
  3,
  'Newfields; Newmarket',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 11',
  'rockingham-11',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  11,
  4,
  'Exeter',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 12',
  'rockingham-12',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  12,
  2,
  'Stratham',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 13',
  'rockingham-13',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  13,
  10,
  'Derry',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 14',
  'rockingham-14',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  14,
  2,
  'East Kingston; Kingston',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 15',
  'rockingham-15',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  15,
  2,
  'Hampstead',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 16',
  'rockingham-16',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  16,
  7,
  'Londonderry',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 17',
  'rockingham-17',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  17,
  4,
  'Windham',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 18',
  'rockingham-18',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  18,
  2,
  'Atkinson',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 19',
  'rockingham-19',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  19,
  1,
  'Hampton Falls; Kensington',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 20',
  'rockingham-20',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  20,
  3,
  'Newton; Plaistow; South Hampton',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 21',
  'rockingham-21',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  21,
  1,
  'Newington; Portsmouth Ward 1',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 22',
  'rockingham-22',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  22,
  1,
  'New Castle; Portsmouth Ward 5',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 23',
  'rockingham-23',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  23,
  1,
  'North Hampton',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 24',
  'rockingham-24',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  24,
  2,
  'Greenland; Rye',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 25',
  'rockingham-25',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  25,
  9,
  'Salem',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 26',
  'rockingham-26',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  26,
  1,
  'Portsmouth Ward 3',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 27',
  'rockingham-27',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  27,
  1,
  'Portsmouth Ward 4',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 28',
  'rockingham-28',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  28,
  1,
  'Portsmouth Ward 2',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 29',
  'rockingham-29',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  29,
  4,
  'Hampton',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 30',
  'rockingham-30',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  30,
  2,
  'Seabrook',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 31',
  'rockingham-31',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  31,
  2,
  'Auburn; Candia; Chester; Deerfield',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 32',
  'rockingham-32',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  32,
  1,
  'Brentwood; Danville; Fremont',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 33',
  'rockingham-33',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  33,
  1,
  'Exeter; Newfields; Newmarket; Stratham',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 34',
  'rockingham-34',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  34,
  1,
  'East Kingston; Hampstead; Kingston',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 35',
  'rockingham-35',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  35,
  1,
  'Londonderry; Windham',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 36',
  'rockingham-36',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  36,
  1,
  'Hampton Falls; Kensington; Newton; Plaistow; South Hampton',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 37',
  'rockingham-37',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  37,
  1,
  'New Castle; Newington; Portsmouth Ward 1; Portsmouth Ward 5',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 38',
  'rockingham-38',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  38,
  1,
  'Greenland; North Hampton; Rye',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 39',
  'rockingham-39',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  39,
  1,
  'Portsmouth Ward 2; Portsmouth Ward 3; Portsmouth Ward 4',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Rockingham 40',
  'rockingham-40',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Rockingham County' OR county = 'Rockingham' OR slug = 'rockingham')
    LIMIT 1
  ),
  'NH',
  'Rockingham',
  40,
  1,
  'Hampton; Seabrook',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Strafford 1',
  'strafford-1',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Strafford County' OR county = 'Strafford' OR slug = 'strafford')
    LIMIT 1
  ),
  'NH',
  'Strafford',
  1,
  2,
  'Farmington',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Strafford 2',
  'strafford-2',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Strafford County' OR county = 'Strafford' OR slug = 'strafford')
    LIMIT 1
  ),
  'NH',
  'Strafford',
  2,
  3,
  'Milton; Rochester Ward 5',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Strafford 3',
  'strafford-3',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Strafford County' OR county = 'Strafford' OR slug = 'strafford')
    LIMIT 1
  ),
  'NH',
  'Strafford',
  3,
  1,
  'Middleton; New Durham',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Strafford 4',
  'strafford-4',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Strafford County' OR county = 'Strafford' OR slug = 'strafford')
    LIMIT 1
  ),
  'NH',
  'Strafford',
  4,
  3,
  'Barrington; Strafford',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Strafford 5',
  'strafford-5',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Strafford County' OR county = 'Strafford' OR slug = 'strafford')
    LIMIT 1
  ),
  'NH',
  'Strafford',
  5,
  1,
  'Rochester Ward 1',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Strafford 6',
  'strafford-6',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Strafford County' OR county = 'Strafford' OR slug = 'strafford')
    LIMIT 1
  ),
  'NH',
  'Strafford',
  6,
  1,
  'Rochester Ward 2',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Strafford 7',
  'strafford-7',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Strafford County' OR county = 'Strafford' OR slug = 'strafford')
    LIMIT 1
  ),
  'NH',
  'Strafford',
  7,
  1,
  'Rochester Ward 3',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Strafford 8',
  'strafford-8',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Strafford County' OR county = 'Strafford' OR slug = 'strafford')
    LIMIT 1
  ),
  'NH',
  'Strafford',
  8,
  1,
  'Rochester Ward 4',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Strafford 9',
  'strafford-9',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Strafford County' OR county = 'Strafford' OR slug = 'strafford')
    LIMIT 1
  ),
  'NH',
  'Strafford',
  9,
  1,
  'Rochester Ward 6',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Strafford 10',
  'strafford-10',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Strafford County' OR county = 'Strafford' OR slug = 'strafford')
    LIMIT 1
  ),
  'NH',
  'Strafford',
  10,
  4,
  'Durham',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Strafford 11',
  'strafford-11',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Strafford County' OR county = 'Strafford' OR slug = 'strafford')
    LIMIT 1
  ),
  'NH',
  'Strafford',
  11,
  3,
  'Dover Ward 4; Lee; Madbury',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Strafford 12',
  'strafford-12',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Strafford County' OR county = 'Strafford' OR slug = 'strafford')
    LIMIT 1
  ),
  'NH',
  'Strafford',
  12,
  4,
  'Rollinsford; Somersworth Ward 1; Somersworth Ward 2; Somersworth Ward 3; Somersworth Ward 4; Somersworth Ward 5',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Strafford 13',
  'strafford-13',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Strafford County' OR county = 'Strafford' OR slug = 'strafford')
    LIMIT 1
  ),
  'NH',
  'Strafford',
  13,
  1,
  'Dover Ward 6',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Strafford 14',
  'strafford-14',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Strafford County' OR county = 'Strafford' OR slug = 'strafford')
    LIMIT 1
  ),
  'NH',
  'Strafford',
  14,
  1,
  'Dover Ward 1',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Strafford 15',
  'strafford-15',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Strafford County' OR county = 'Strafford' OR slug = 'strafford')
    LIMIT 1
  ),
  'NH',
  'Strafford',
  15,
  1,
  'Dover Ward 2',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Strafford 16',
  'strafford-16',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Strafford County' OR county = 'Strafford' OR slug = 'strafford')
    LIMIT 1
  ),
  'NH',
  'Strafford',
  16,
  1,
  'Dover Ward 3',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Strafford 17',
  'strafford-17',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Strafford County' OR county = 'Strafford' OR slug = 'strafford')
    LIMIT 1
  ),
  'NH',
  'Strafford',
  17,
  1,
  'Dover Ward 5',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Strafford 18',
  'strafford-18',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Strafford County' OR county = 'Strafford' OR slug = 'strafford')
    LIMIT 1
  ),
  'NH',
  'Strafford',
  18,
  1,
  'Barrington; Middleton; New Durham; Strafford',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Strafford 19',
  'strafford-19',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Strafford County' OR county = 'Strafford' OR slug = 'strafford')
    LIMIT 1
  ),
  'NH',
  'Strafford',
  19,
  3,
  'Rochester Ward 1; Rochester Ward 2; Rochester Ward 3; Rochester Ward 4; Rochester Ward 6',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Strafford 20',
  'strafford-20',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Strafford County' OR county = 'Strafford' OR slug = 'strafford')
    LIMIT 1
  ),
  'NH',
  'Strafford',
  20,
  1,
  'Dover Ward 4; Durham; Lee; Madbury',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Strafford 21',
  'strafford-21',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Strafford County' OR county = 'Strafford' OR slug = 'strafford')
    LIMIT 1
  ),
  'NH',
  'Strafford',
  21,
  3,
  'Dover Ward 1; Dover Ward 2; Dover Ward 3; Dover Ward 5; Dover Ward 6',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Sullivan 1',
  'sullivan-1',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Sullivan County' OR county = 'Sullivan' OR slug = 'sullivan')
    LIMIT 1
  ),
  'NH',
  'Sullivan',
  1,
  1,
  'Grantham',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Sullivan 2',
  'sullivan-2',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Sullivan County' OR county = 'Sullivan' OR slug = 'sullivan')
    LIMIT 1
  ),
  'NH',
  'Sullivan',
  2,
  1,
  'Cornish; Plainfield',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Sullivan 3',
  'sullivan-3',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Sullivan County' OR county = 'Sullivan' OR slug = 'sullivan')
    LIMIT 1
  ),
  'NH',
  'Sullivan',
  3,
  3,
  'Charlestown; Newport; Unity',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Sullivan 4',
  'sullivan-4',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Sullivan County' OR county = 'Sullivan' OR slug = 'sullivan')
    LIMIT 1
  ),
  'NH',
  'Sullivan',
  4,
  1,
  'Acworth; Goshen; Langdon; Lempster; Washington',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Sullivan 5',
  'sullivan-5',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Sullivan County' OR county = 'Sullivan' OR slug = 'sullivan')
    LIMIT 1
  ),
  'NH',
  'Sullivan',
  5,
  1,
  'Springfield; Sunapee',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Sullivan 6',
  'sullivan-6',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Sullivan County' OR county = 'Sullivan' OR slug = 'sullivan')
    LIMIT 1
  ),
  'NH',
  'Sullivan',
  6,
  3,
  'Claremont Ward 1; Claremont Ward 2; Claremont Ward 3; Croydon',
  'False'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Sullivan 7',
  'sullivan-7',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Sullivan County' OR county = 'Sullivan' OR slug = 'sullivan')
    LIMIT 1
  ),
  'NH',
  'Sullivan',
  7,
  1,
  'Charlestown; Cornish; Newport; Plainfield; Unity',
  'True'
;

INSERT INTO divisions (
  name,
  slug,
  type,
  parent_id,
  state,
  county,
  district,
  seats,
  towns_represented,
  floterial
)
SELECT
  'Sullivan 8',
  'sullivan-8',
  'house_district',
  (
    SELECT id
    FROM divisions
    WHERE type = 'county'
      AND (name = 'Sullivan County' OR county = 'Sullivan' OR slug = 'sullivan')
    LIMIT 1
  ),
  'NH',
  'Sullivan',
  8,
  2,
  'Acworth; Claremont Ward 1; Claremont Ward 2; Claremont Ward 3; Croydon; Goshen; Langdon; Lempster; Springfield; Sunapee; Washington',
  'True'
;
