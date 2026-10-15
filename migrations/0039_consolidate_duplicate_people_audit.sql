-- Consolidate 81 redundant d1_people records across 79 well-supported identity
-- groups identified by the production audit on 2026-10-11. Fourteen weaker
-- same-name/name-variant groups remain deferred for individual confirmation.
-- Lisa Brown is intentionally excluded: the Hillsborough 1 and Merrimack 28 candidates are different people.
-- This migration preserves linked roles, finance, election results, content, analytics, submissions, endorsements, contact fields, aliases, and every retired profile URL.

CREATE TABLE _duplicate_person_merges (
  source_id INTEGER PRIMARY KEY,
  target_id INTEGER NOT NULL,
  source_slug TEXT NOT NULL,
  target_slug TEXT NOT NULL,
  target_name TEXT NOT NULL,
  source_name TEXT NOT NULL,
  category TEXT NOT NULL,
  confidence TEXT NOT NULL,
  source_filer TEXT
);

INSERT INTO _duplicate_person_merges (source_id,target_id,source_slug,target_slug,target_name,source_name,category,confidence) VALUES
  (525, 164, '242640-cassandra-levesque', 'cassandra--levesque-9425', 'Cassandra  Levesque', 'Cassandra Levesque', 'near-certain duplicate', 'high'),
  (852, 1705, 'charles-r-heuer', 'sos-2026-house-rockingham-3-chuck-heuer', 'Chuck Heuer', 'Charles Heuer', 'near-certain duplicate', 'high'),
  (1702, 188, 'sos-2026-house-hillsborough-34-daniel-t-veilleux', 'daniel-veilleux-9905', 'Daniel Veilleux', 'Daniel T. Veilleux', 'near-certain duplicate', 'high'),
  (838, 350, 'eleana-m-colby', 'eleana--colby-11230', 'Eleana  Colby', 'Eleana Colby', 'near-certain duplicate', 'high'),
  (791, 517, 'greg-erskine', '244334-gregory-erskine', 'Gregory Erskine', 'Greg Erskine', 'near-certain duplicate', 'high'),
  (850, 580, 'hal-rafter', '242358-harold-rafter', 'Harold Rafter', 'Hal Rafter', 'near-certain duplicate', 'high'),
  (538, 863, '244364-james-marshall', 'jim-marshall', 'Jim Marshall', 'James Marshall', 'near-certain duplicate', 'high'),
  (573, 712, '242268-james-pittman', 'jim-pittman', 'Jim Pittman', 'James Pittman', 'near-certain duplicate', 'high'),
  (754, 437, 'jeff-kerr', '242632-jeffrey-kerr', 'Jeffrey Kerr', 'Jeff Kerr', 'near-certain duplicate', 'high'),
  (856, 463, 'jj-defeo', '244283-john-defeo', 'John DeFeo', 'JJ DeFeo', 'near-certain duplicate', 'high'),
  (1145, 79, 'joe-a-guthrie', 'joseph-guthrie-936', 'Joseph Guthrie', 'Joe Guthrie', 'near-certain duplicate', 'high'),
  (709, 1693, 'meredith-morgan-bultman', 'sos-2026-house-carroll-5-morgan-bultman', 'Morgan Bultman', 'Meredith Bultman', 'near-certain duplicate', 'high'),
  (438, 171, '165822-michael-bordes', 'mike-bordes', 'Mike Bordes', 'Michael Bordes', 'near-certain duplicate', 'high'),
  (1741, 82, 'sos-2026-house-strafford-1-sue-delemus', 'susan-delemus-947', 'Susan DeLemus', 'Susan DeLemus', 'near-certain duplicate', 'high'),
  (614, 335, '243557-george-spahr', 'terry-spahr-11184', 'Terry Spahr', 'George Spahr', 'near-certain duplicate', 'high'),
  (602, 49, '208217-tom-schamberg', 'thomas-schamberg-771', 'Thomas Schamberg', 'Tom Schamberg', 'near-certain duplicate', 'high'),
  (513, 1070, '244205-thomas-trost', 'tom-trost', 'Tom Trost', 'Thomas Trost', 'near-certain duplicate', 'high'),
  (892, 604, 'ginna-schonwald', '243669-virginia-schonwald', 'Virginia Schonwald', 'Ginna Schonwald', 'near-certain duplicate', 'high'),
  (897, 508, 'will-hurley', '244215-william-hurley', 'William Hurley', 'Will Hurley', 'near-certain duplicate', 'high'),
  (595, 886, '243659-yasamin-safarzadeh', 'yaz-safarzadeh', 'Yaz Safarzadeh', 'Yasamin Safarzadeh', 'near-certain duplicate', 'high'),
  (1395, 1076, 'ben-prescott-delegate-to-state-convention-hillsborough-41-rep', 'ben-prescott', 'Ben Prescott', 'Ben Prescott', 'delegate/import split', 'high'),
  (1268, 1199, 'brett-i-williams-delegate-to-state-convention-carroll-7-rep', 'brett-i-williams', 'Brett Williams', 'Brett Williams', 'delegate/import split', 'high'),
  (1391, 1098, 'carlos-gonzalez-delegate-to-state-convention-hillsborough-40-rep', 'carlos-gonzalez', 'Carlos Gonzalez', 'Carlos Gonzalez', 'delegate/import split', 'high'),
  (1267, 227, 'katy-peternel', 'katy-peternel-10579', 'Catherine Peternel', 'Katy Peternel', 'role/profile split', 'medium-high'),
  (1434, 1201, 'chuck-mcgee-delegate-to-state-convention-merrimack-29-rep', 'chuck-mcgee', 'Chuck McGee', 'Chuck McGee', 'delegate/import split', 'high'),
  (1379, 560, 'diane-layton-delegate-to-state-convention-hillsborough-34-rep', '242365-diane-layton', 'Diane Layton', 'Diane Layton', 'delegate/import split', 'high'),
  (1320, 1059, 'doris-hohensee-delegate-to-state-convention-hillsborough-6-rep', 'doris-hohensee', 'Doris Hohensee', 'Doris Hohensee', 'delegate/import split', 'high'),
  (1446, 1134, 'emily-phillips-delegate-to-state-convention-rockingham-7-rep', 'emily-phillips', 'Emily Phillips', 'Emily Phillips', 'delegate/import split', 'high'),
  (1352, 1077, 'george-l-d-orazio-delegate-to-state-convention-hillsborough-19-rep', 'george-l-d-orazio', 'George D''Orazio', 'George D''Orazio', 'delegate/import split', 'high'),
  (927, 51, 'george-sykes', 'george-sykes-781', 'George Sykes', 'George Sykes', 'role/profile split', 'medium-high'),
  (620, 51, '243691-george-sykes', 'george-sykes-781', 'George Sykes', 'George Sykes', 'role/profile split', 'medium-high'),
  (1297, 1042, 'greg-mathieson-delegate-to-state-convention-grafton-5-rep', 'greg-mathieson', 'Greg Mathieson', 'Greg Mathieson', 'delegate/import split', 'high'),
  (1467, 1147, 'gregory-g-carson-delegate-to-state-convention-rockingham-16-rep', 'gregory-g-carson', 'Gregory Carson', 'Gregory Carson', 'delegate/import split', 'high'),
  (1440, 977, 'harriet-e-cady-delegate-to-state-convention-rockingham-2-rep', 'harriet-e-cady', 'Harriet Cady', 'Harriet Cady', 'delegate/import split', 'high'),
  (661, 213, 'heath-howard', 'heath-howard-10004', 'Heath Howard', 'Heath Howard', 'role/profile split', 'medium-high'),
  (1374, 1089, 'jarvis-m-adams-iv-delegate-to-state-convention-hillsborough-31-rep', 'jarvis-m-adams-iv', 'Jarvis Adams', 'Jarvis Adams', 'delegate/import split', 'high'),
  (1504, 206, 'jd-bernardy-delegate-to-state-convention-rockingham-36-rep', 'jd-bernardy-9941', 'JD Bernardy', 'JD Bernardy', 'delegate/import split', 'high'),
  (1288, 1028, 'jerry-l-sickels-delegate-to-state-convention-cheshire-15-rep', 'jerry-l-sickels', 'Jerry Sickels', 'Jerry Sickels', 'delegate/import split', 'high'),
  (1500, 108, 'jess-edwards-delegate-to-state-convention-rockingham-31-rep', 'jess-edwards-8392', 'Jess Edwards', 'Jess Edwards', 'delegate/import split', 'high'),
  (1532, 165, 'judy-aron', 'judy-aron-9429', 'Judy Aron', 'Judy Aron', 'role/profile split', 'medium-high'),
  (1286, 1203, 'kate-day-delegate-to-state-convention-cheshire-15-rep', 'kate-day', 'Kate Day', 'Kate Day', 'delegate/import split', 'high'),
  (1330, 1066, 'kevin-francis-ballantine-delegate-to-state-convention-hillsborough-12-rep', 'kevin-francis-ballantine', 'Kevin Ballantine', 'Kevin Ballantine', 'delegate/import split', 'high'),
  (1337, 1067, 'kevin-southwick-delegate-to-state-convention-hillsborough-12-rep', 'kevin-southwick', 'Kevin Southwick', 'Kevin Southwick', 'delegate/import split', 'high'),
  (1347, 23, 'larry-g-gagne', 'larry-gagne-573', 'Larry Gagne', 'Larry Gagne', 'role/profile split', 'medium-high'),
  (1311, 61, 'linda-gould', 'linda-gould-849', 'Linda Gould', 'Linda Gould', 'role/profile split', 'medium-high'),
  (1480, 990, 'lou-gargiulo-delegate-to-state-convention-rockingham-19-rep', 'lou-gargiulo', 'Lou Gargiulo', 'Lou Gargiulo', 'delegate/import split', 'high'),
  (668, 315, 'luz-bay', 'luz-bay-10904', 'Luz Bay', 'Luz Bay', 'role/profile split', 'medium-high'),
  (1503, 126, 'mark-a-pearson-delegate-to-state-convention-rockingham-34-rep', 'mark-pearson-8749', 'Mark Pearson', 'Mark Pearson', 'delegate/import split', 'high'),
  (1433, 1117, 'mary-rose-deak-delegate-to-state-convention-merrimack-29-rep', 'mary-rose-deak', 'Mary Deak', 'Mary Deak', 'delegate/import split', 'high'),
  (1523, 1175, 'matthew-d-albion-delegate-to-state-convention-strafford-17-rep', 'matthew-d-albion', 'Matthew Albion', 'Matthew Albion', 'delegate/import split', 'high'),
  (1537, 409, 'michael-aron', 'michael-aron-11442', 'Michael Aron', 'Michael Aron', 'role/profile split', 'medium-high'),
  (1527, 1181, 'michael-belanger-delegate-to-state-convention-sullivan-2-rep', 'michael-belanger', 'Michael Belanger', 'Michael Belanger', 'delegate/import split', 'high'),
  (1473, 1149, 'moira-ryan-delegate-to-state-convention-rockingham-16-rep', 'moira-ryan', 'Moira Ryan', 'Moira Ryan', 'delegate/import split', 'high'),
  (666, 323, 'paige-beauchemin', 'paige-beauchemin-11100', 'Paige Beauchemin', 'Paige Beauchemin', 'role/profile split', 'medium-high'),
  (1463, 399, 'pam-brown-delegate-to-state-convention-rockingham-14-rep', 'pam-brown-11407', 'Pam Brown', 'Pam Brown', 'delegate/import split', 'high'),
  (1319, 1727, 'paul-schibbelhute', 'sos-2026-house-hillsborough-5-paul-schibbelhute', 'Paul Schibbelhute', 'Paul Schibbelhute', 'role/profile split', 'medium-high'),
  (1386, 17, 'ralph-g-boehm-delegate-to-state-convention-hillsborough-38-rep', 'ralph-boehm-502', 'Ralph Boehm', 'Ralph Boehm', 'delegate/import split', 'high'),
  (1512, 1232, 'robert-j-drew-delegate-to-state-convention-strafford-4-rep', 'robert-j-drew', 'Robert Drew', 'Robert Drew', 'delegate/import split', 'high'),
  (1536, 1237, 'rodd-ward-delegate-to-state-convention-sullivan-7-rep', 'rodd-ward', 'Rodd Ward', 'Rodd Ward', 'delegate/import split', 'high'),
  (1363, 1211, 'ross-w-terrio-delegate-to-state-convention-hillsborough-26-rep', 'ross-w-terrio', 'Ross Terrio', 'Ross Terrio', 'delegate/import split', 'high'),
  (1541, 1188, 'sebastian-zyzdorf-delegate-to-state-convention-sullivan-8-rep', 'sebastian-zyzdorf', 'Sebastian Zyzdorf', 'Sebastian Zyzdorf', 'delegate/import split', 'high'),
  (1469, 1226, 'shawn-faber-delegate-to-state-convention-rockingham-16-rep', 'shawn-faber', 'Shawn Faber', 'Shawn Faber', 'delegate/import split', 'high'),
  (1508, 1164, 'sue-polidura-delegate-to-state-convention-rockingham-39-rep', 'sue-polidura', 'Sue Polidura', 'Sue Polidura', 'delegate/import split', 'high'),
  (586, 1231, '244312-susan-rice', 'susan-j-rice', 'Susan Rice', 'Susan Rice', 'delegate/import split', 'high'),
  (1511, 1231, 'susan-j-rice-delegate-to-state-convention-strafford-2-rep', 'susan-j-rice', 'Susan Rice', 'Susan Rice', 'delegate/import split', 'high'),
  (1488, 264, 'tanya-donnelly', 'tanya-donnelly-10704', 'Tanya Donnelly', 'Tanya Donnelly', 'role/profile split', 'medium-high'),
  (1530, 533, 'tobin-menard-delegate-to-state-convention-sullivan-3-rep', '244332-tobin-menard', 'TOBIN MENARD', 'Tobin Menard', 'delegate/import split', 'high'),
  (1381, 970, 'victor-orlando-delegate-to-state-convention-hillsborough-35-rep', 'victor-orlando', 'Victor Orlando', 'Victor Orlando', 'delegate/import split', 'high'),
  (1471, 211, 'wayne-d-macdonald-delegate-to-state-convention-rockingham-16-rep', 'wayne-macdonald-9951', 'Wayne MacDonald', 'Wayne MacDonald', 'delegate/import split', 'high'),
  (1338, 1068, 'wolfram-von-schoen-delegate-to-state-convention-hillsborough-12-rep', 'wolfram-von-schoen', 'Wolfram Schoen', 'Wolfram Schoen', 'delegate/import split', 'high'),
  (422, 1140, '244346-zakari-appleton', 'michael-appleton', 'Michael Appleton', 'Zakari Appleton', 'role/profile split', 'medium-high'),
  (641, 3, '242732-mary-wallner', 'mary-jane-wallner-411', 'Mary Jane Wallner', 'Mary Wallner', 'name variant', 'high'),
  (695, 128, 'charlie-st-clair', 'charlie-st-clair-8956', 'Charlie St. Clair', 'Charlie Clair', 'name variant', 'high'),
  (983, 192, 'jim-creighton', 'james-creighton-9917', 'James Creighton', 'Jim Creighton', 'name variant', 'high'),
  (1069, 240, 'cathy-kenny', 'catherine-kenny-10640', 'Catherine Kenny', 'Cathy Kenny', 'name variant', 'high'),
  (1131, 254, 'michael-drago', 'mike-drago-10686', 'Mike Drago', 'Michael Drago', 'name variant', 'high'),
  (992, 272, 'matt-coker', 'matthew-coker-10733', 'Matthew Coker', 'Matt Coker', 'name variant', 'high'),
  (1041, 371, 'marie-louise-bjelobrk', 'marie-louise-bjelobrk-11326', 'Marie Louise Bjelobrk', 'Marie Bjelobrk', 'name variant', 'high'),
  (1037, 109, 'peter-morency', 'pete-morency-8401', 'Pete Morency', 'Peter Morency', 'name variant', 'high'),
  (1103, 248, 'rick-devoid', 'ricky-devoid-10669', 'Ricky Devoid', 'Rick Devoid', 'name variant', 'high'),
  (773, 43, 'marty-jack', 'martin-jack-733', 'Martin Jack', 'Marty Jack', 'name variant', 'high');

UPDATE _duplicate_person_merges
SET source_filer = (SELECT filer_entity_number FROM d1_people WHERE id = source_id);

CREATE TABLE _duplicate_person_merge_guard (valid INTEGER NOT NULL CHECK(valid = 1));
INSERT INTO _duplicate_person_merge_guard(valid)
SELECT CASE WHEN
  (SELECT COUNT(*) FROM d1_people WHERE id IN (SELECT source_id FROM _duplicate_person_merges)) = 81
  AND (SELECT COUNT(DISTINCT target_id) FROM _duplicate_person_merges WHERE target_id IN (SELECT id FROM d1_people)) = 79
  AND NOT EXISTS (SELECT 1 FROM _duplicate_person_merges m JOIN d1_people p ON p.id=m.source_id WHERE p.slug <> m.source_slug)
  AND NOT EXISTS (SELECT 1 FROM _duplicate_person_merges m JOIN d1_people p ON p.id=m.target_id WHERE p.slug <> m.target_slug)
THEN 1 ELSE 0 END;

UPDATE d1_person_candidate_roles
SET person_id = (SELECT target_id FROM _duplicate_person_merges m WHERE m.source_id=d1_person_candidate_roles.person_id), updated_at=CURRENT_TIMESTAMP
WHERE person_id IN (SELECT source_id FROM _duplicate_person_merges);

UPDATE OR IGNORE d1_person_legislator_roles
SET person_id = (SELECT target_id FROM _duplicate_person_merges m WHERE m.source_id=d1_person_legislator_roles.person_id), updated_at=CURRENT_TIMESTAMP
WHERE person_id IN (SELECT source_id FROM _duplicate_person_merges);
DELETE FROM d1_person_legislator_roles WHERE person_id IN (SELECT source_id FROM _duplicate_person_merges);

UPDATE d1_candidate_contributions
SET person_id = (SELECT target_id FROM _duplicate_person_merges m WHERE m.source_id=d1_candidate_contributions.person_id), updated_at=CURRENT_TIMESTAMP
WHERE person_id IN (SELECT source_id FROM _duplicate_person_merges);

UPDATE d1_candidate_primary_results
SET person_id = (SELECT target_id FROM _duplicate_person_merges m WHERE m.source_id=d1_candidate_primary_results.person_id), updated_at=CURRENT_TIMESTAMP
WHERE person_id IN (SELECT source_id FROM _duplicate_person_merges);

INSERT OR IGNORE INTO d1_article_people(article_id,person_id,relation_type,source,raw_name,created_at)
SELECT ap.article_id,m.target_id,ap.relation_type,ap.source,ap.raw_name,ap.created_at
FROM d1_article_people ap JOIN _duplicate_person_merges m ON m.source_id=ap.person_id;
DELETE FROM d1_article_people WHERE person_id IN (SELECT source_id FROM _duplicate_person_merges);

UPDATE community_update_mentions
SET person_id = (SELECT target_id FROM _duplicate_person_merges m WHERE m.source_id=community_update_mentions.person_id OR '/people/'||m.source_slug=community_update_mentions.path LIMIT 1),
    name = (SELECT target_name FROM _duplicate_person_merges m WHERE m.source_id=community_update_mentions.person_id OR '/people/'||m.source_slug=community_update_mentions.path LIMIT 1),
    path = (SELECT '/people/'||target_slug FROM _duplicate_person_merges m WHERE m.source_id=community_update_mentions.person_id OR '/people/'||m.source_slug=community_update_mentions.path LIMIT 1)
WHERE person_id IN (SELECT source_id FROM _duplicate_person_merges) OR path IN (SELECT '/people/'||source_slug FROM _duplicate_person_merges);

UPDATE links
SET entity_id=(SELECT target_id FROM _duplicate_person_merges m WHERE m.source_id=links.entity_id)
WHERE entity_type IN ('person','candidate') AND entity_id IN (SELECT source_id FROM _duplicate_person_merges);

UPDATE d1_person_profile_url_aliases
SET person_id=(SELECT target_id FROM _duplicate_person_merges m WHERE m.source_id=d1_person_profile_url_aliases.person_id), updated_at=CURRENT_TIMESTAMP
WHERE person_id IN (SELECT source_id FROM _duplicate_person_merges);

UPDATE OR IGNORE organization_endorsements
SET candidate_name=(SELECT target_name FROM _duplicate_person_merges m WHERE m.source_slug=organization_endorsements.candidate_slug_key OR m.source_slug=organization_endorsements.candidate_slug LIMIT 1),
    candidate_slug=(SELECT target_slug FROM _duplicate_person_merges m WHERE m.source_slug=organization_endorsements.candidate_slug_key OR m.source_slug=organization_endorsements.candidate_slug LIMIT 1),
    candidate_slug_key=(SELECT target_slug FROM _duplicate_person_merges m WHERE m.source_slug=organization_endorsements.candidate_slug_key OR m.source_slug=organization_endorsements.candidate_slug LIMIT 1),
    updated_at=CURRENT_TIMESTAMP
WHERE candidate_slug_key IN (SELECT source_slug FROM _duplicate_person_merges) OR candidate_slug IN (SELECT source_slug FROM _duplicate_person_merges);
DELETE FROM organization_endorsements
WHERE candidate_slug_key IN (SELECT source_slug FROM _duplicate_person_merges) OR candidate_slug IN (SELECT source_slug FROM _duplicate_person_merges);

UPDATE profile_update_submissions
SET person_key=(SELECT target_slug FROM _duplicate_person_merges m WHERE profile_update_submissions.person_key IN (CAST(m.source_id AS TEXT),m.source_slug) OR instr(COALESCE(profile_update_submissions.page_url,''),'/people/'||m.source_slug)>0 LIMIT 1),
    person_name=(SELECT target_name FROM _duplicate_person_merges m WHERE profile_update_submissions.person_key IN (CAST(m.source_id AS TEXT),m.source_slug) OR instr(COALESCE(profile_update_submissions.page_url,''),'/people/'||m.source_slug)>0 LIMIT 1),
    page_url=(SELECT 'https://nhdeservesbetter.com/people/'||target_slug FROM _duplicate_person_merges m WHERE profile_update_submissions.person_key IN (CAST(m.source_id AS TEXT),m.source_slug) OR instr(COALESCE(profile_update_submissions.page_url,''),'/people/'||m.source_slug)>0 LIMIT 1)
WHERE EXISTS (SELECT 1 FROM _duplicate_person_merges m WHERE profile_update_submissions.person_key IN (CAST(m.source_id AS TEXT),m.source_slug) OR instr(COALESCE(profile_update_submissions.page_url,''),'/people/'||m.source_slug)>0);

INSERT OR IGNORE INTO d1_profile_view_visitors(person_id,view_date,visitor_hash,created_at)
SELECT m.target_id,v.view_date,v.visitor_hash,v.created_at FROM d1_profile_view_visitors v JOIN _duplicate_person_merges m ON m.source_id=v.person_id;
DELETE FROM d1_profile_view_visitors WHERE person_id IN (SELECT source_id FROM _duplicate_person_merges);

INSERT INTO d1_profile_view_daily(person_id,view_date,views,unique_visitors,first_viewed_at,last_viewed_at)
SELECT m.target_id,d.view_date,SUM(d.views),SUM(d.unique_visitors),MIN(d.first_viewed_at),MAX(d.last_viewed_at)
FROM d1_profile_view_daily d JOIN _duplicate_person_merges m ON m.source_id=d.person_id GROUP BY m.target_id,d.view_date
ON CONFLICT(person_id,view_date) DO UPDATE SET views=d1_profile_view_daily.views+excluded.views, first_viewed_at=MIN(d1_profile_view_daily.first_viewed_at,excluded.first_viewed_at), last_viewed_at=MAX(d1_profile_view_daily.last_viewed_at,excluded.last_viewed_at);
DELETE FROM d1_profile_view_daily WHERE person_id IN (SELECT source_id FROM _duplicate_person_merges);
UPDATE d1_profile_view_daily SET unique_visitors=(SELECT COUNT(*) FROM d1_profile_view_visitors v WHERE v.person_id=d1_profile_view_daily.person_id AND v.view_date=d1_profile_view_daily.view_date) WHERE person_id IN (SELECT target_id FROM _duplicate_person_merges);

-- Release unique filer values before assigning a missing one to a survivor. All role-level filer values remain intact.
UPDATE d1_people SET filer_entity_number=NULL, updated_at=CURRENT_TIMESTAMP WHERE id IN (SELECT source_id FROM _duplicate_person_merges);

UPDATE d1_people
SET filer_entity_number=COALESCE(NULLIF(TRIM(filer_entity_number),''),(SELECT source_filer FROM _duplicate_person_merges m WHERE m.target_id=d1_people.id AND TRIM(COALESCE(m.source_filer,''))<>'' ORDER BY m.source_id LIMIT 1)),
    firstname = COALESCE(NULLIF(TRIM(firstname), ''), (SELECT NULLIF(TRIM(s.firstname), '') FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND TRIM(COALESCE(s.firstname, '')) <> '' ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    lastname = COALESCE(NULLIF(TRIM(lastname), ''), (SELECT NULLIF(TRIM(s.lastname), '') FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND TRIM(COALESCE(s.lastname, '')) <> '' ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    middlename = COALESCE(NULLIF(TRIM(middlename), ''), (SELECT NULLIF(TRIM(s.middlename), '') FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND TRIM(COALESCE(s.middlename, '')) <> '' ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    party = COALESCE(NULLIF(TRIM(party), ''), (SELECT NULLIF(TRIM(s.party), '') FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND TRIM(COALESCE(s.party, '')) <> '' ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    email = COALESCE(NULLIF(TRIM(email), ''), (SELECT NULLIF(TRIM(s.email), '') FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND TRIM(COALESCE(s.email, '')) <> '' ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    phone = COALESCE(NULLIF(TRIM(phone), ''), (SELECT NULLIF(TRIM(s.phone), '') FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND TRIM(COALESCE(s.phone, '')) <> '' ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    website_url = COALESCE(NULLIF(TRIM(website_url), ''), (SELECT NULLIF(TRIM(s.website_url), '') FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND TRIM(COALESCE(s.website_url, '')) <> '' ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    substack_url = COALESCE(NULLIF(TRIM(substack_url), ''), (SELECT NULLIF(TRIM(s.substack_url), '') FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND TRIM(COALESCE(s.substack_url, '')) <> '' ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    instagram_url = COALESCE(NULLIF(TRIM(instagram_url), ''), (SELECT NULLIF(TRIM(s.instagram_url), '') FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND TRIM(COALESCE(s.instagram_url, '')) <> '' ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    facebook_url = COALESCE(NULLIF(TRIM(facebook_url), ''), (SELECT NULLIF(TRIM(s.facebook_url), '') FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND TRIM(COALESCE(s.facebook_url, '')) <> '' ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    tiktok_url = COALESCE(NULLIF(TRIM(tiktok_url), ''), (SELECT NULLIF(TRIM(s.tiktok_url), '') FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND TRIM(COALESCE(s.tiktok_url, '')) <> '' ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    x_url = COALESCE(NULLIF(TRIM(x_url), ''), (SELECT NULLIF(TRIM(s.x_url), '') FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND TRIM(COALESCE(s.x_url, '')) <> '' ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    bluesky_url = COALESCE(NULLIF(TRIM(bluesky_url), ''), (SELECT NULLIF(TRIM(s.bluesky_url), '') FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND TRIM(COALESCE(s.bluesky_url, '')) <> '' ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    ballotpedia_url = COALESCE(NULLIF(TRIM(ballotpedia_url), ''), (SELECT NULLIF(TRIM(s.ballotpedia_url), '') FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND TRIM(COALESCE(s.ballotpedia_url, '')) <> '' ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    citizens_count_url = COALESCE(NULLIF(TRIM(citizens_count_url), ''), (SELECT NULLIF(TRIM(s.citizens_count_url), '') FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND TRIM(COALESCE(s.citizens_count_url, '')) <> '' ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    state_house_profile_url = COALESCE(NULLIF(TRIM(state_house_profile_url), ''), (SELECT NULLIF(TRIM(s.state_house_profile_url), '') FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND TRIM(COALESCE(s.state_house_profile_url, '')) <> '' ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    photo_url=COALESCE(NULLIF(CASE WHEN LOWER(TRIM(COALESCE(photo_url,''))) IN ('','https://photos.nhciviccommons.com','https://photos.nhciviccommons.com/') THEN '' ELSE TRIM(photo_url) END,''),(SELECT NULLIF(TRIM(s.photo_url),'') FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id=s.id WHERE m.target_id=d1_people.id AND LOWER(TRIM(COALESCE(s.photo_url,''))) NOT IN ('','https://photos.nhciviccommons.com','https://photos.nhciviccommons.com/') ORDER BY s.is_current_legislator DESC,s.is_2026_candidate DESC,s.id LIMIT 1)),
    is_current_legislator=MAX(is_current_legislator,COALESCE((SELECT MAX(s.is_current_legislator) FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id=s.id WHERE m.target_id=d1_people.id),0)),
    is_2026_legislator=MAX(is_2026_legislator,COALESCE((SELECT MAX(s.is_2026_legislator) FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id=s.id WHERE m.target_id=d1_people.id),0)),
    is_2026_candidate=MAX(is_2026_candidate,COALESCE((SELECT MAX(s.is_2026_candidate) FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id=s.id WHERE m.target_id=d1_people.id),0)),
    is_free_stater=MAX(is_free_stater,COALESCE((SELECT MAX(s.is_free_stater) FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id=s.id WHERE m.target_id=d1_people.id),0)),
    is_free_state_aligned_2026=MAX(is_free_state_aligned_2026,COALESCE((SELECT MAX(s.is_free_state_aligned_2026) FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id=s.id WHERE m.target_id=d1_people.id),0)),
    is_tpaction_aligned_2026=MAX(is_tpaction_aligned_2026,COALESCE((SELECT MAX(s.is_tpaction_aligned_2026) FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id=s.id WHERE m.target_id=d1_people.id),0)),
    online_testimony_alignment_pct = COALESCE(online_testimony_alignment_pct, (SELECT s.online_testimony_alignment_pct FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND s.online_testimony_alignment_pct IS NOT NULL ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    online_testimony_grade = COALESCE(online_testimony_grade, (SELECT s.online_testimony_grade FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND s.online_testimony_grade IS NOT NULL ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    online_testimony_scored_votes = COALESCE(online_testimony_scored_votes, (SELECT s.online_testimony_scored_votes FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND s.online_testimony_scored_votes IS NOT NULL ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    online_testimony_aligned_votes = COALESCE(online_testimony_aligned_votes, (SELECT s.online_testimony_aligned_votes FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND s.online_testimony_aligned_votes IS NOT NULL ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    online_testimony_partial_votes = COALESCE(online_testimony_partial_votes, (SELECT s.online_testimony_partial_votes FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND s.online_testimony_partial_votes IS NOT NULL ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    online_testimony_misaligned_votes = COALESCE(online_testimony_misaligned_votes, (SELECT s.online_testimony_misaligned_votes FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND s.online_testimony_misaligned_votes IS NOT NULL ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    grade_updated_at = COALESCE(grade_updated_at, (SELECT s.grade_updated_at FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id = s.id WHERE m.target_id = d1_people.id AND s.grade_updated_at IS NOT NULL ORDER BY s.is_current_legislator DESC, s.is_2026_candidate DESC, s.id LIMIT 1)),
    name_aliases=TRIM(COALESCE(NULLIF(TRIM(name_aliases),''),'') || CASE WHEN TRIM(COALESCE(name_aliases,''))<>'' THEN ', ' ELSE '' END || COALESCE((SELECT GROUP_CONCAT(DISTINCT s.display_name) FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id=s.id WHERE m.target_id=d1_people.id),'') || COALESCE((SELECT CASE WHEN COUNT(NULLIF(TRIM(s.name_aliases),''))>0 THEN ', '||GROUP_CONCAT(DISTINCT NULLIF(TRIM(s.name_aliases),'')) ELSE '' END FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id=s.id WHERE m.target_id=d1_people.id),''),', '),
    created_at=MIN(created_at,COALESCE((SELECT MIN(s.created_at) FROM d1_people s JOIN _duplicate_person_merges m ON m.source_id=s.id WHERE m.target_id=d1_people.id),created_at)),
    updated_at=CURRENT_TIMESTAMP
WHERE id IN (SELECT target_id FROM _duplicate_person_merges);

DELETE FROM d1_people WHERE id IN (SELECT source_id FROM _duplicate_person_merges);

INSERT INTO d1_person_profile_url_aliases(alias_slug,person_id,created_at,updated_at)
SELECT source_slug,target_id,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM _duplicate_person_merges
WHERE true
ON CONFLICT(alias_slug) DO UPDATE SET person_id=excluded.person_id,updated_at=CURRENT_TIMESTAMP;

INSERT INTO admin_audit_log(actor_email,actor_role,action,target_type,target_id,outcome,http_status,request_path)
SELECT 'codex-maintenance@nhdeservesbetter.com','super_admin','merge_duplicate_person_profile','person',CAST(source_id AS TEXT)||'->'||CAST(target_id AS TEXT),'success',200,'/maintenance/duplicate-profile-audit-2026-10-12' FROM _duplicate_person_merges;

DROP TABLE _duplicate_person_merge_guard;
DROP TABLE _duplicate_person_merges;
