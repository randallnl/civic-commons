# Candidate Filing Audit Summary - State Rep and State Senate Only

Source PDF: `cumulative-filings-6.29.26.pdf`

This summary is based on the completed audit run from the PDF against the D1-backed candidate list. The original full report was written to `/tmp`, which was not easy to open and is no longer available in this resumed environment.

## Counts

- PDF rows parsed: 791
  - State Representative: 740
  - State Senate: 51
- D1/site rows exported: 849
  - State Representative: 783
  - State Senate: 66
- Exact duplicate D1 keys: 12
- Possible duplicate D1 keys: 15
- Same first/last appears in multiple districts in D1: 7
- Name variants matched by first/last: 38
- PDF candidates not matched in D1: 52
- D1 candidates not matched in PDF: 97

## Exact D1 Duplicates

- JOSE' CAMBRILS / Jose Cambrils - Republican - State Representative - Merrimack District 4
  - `person:445 filer:241941 slug:241941-jose-cambrils`
  - `person:1108 filer:981182719 slug:jose-eduardo-cambrils`
- Brian Seaworth - Republican - State Representative - Merrimack District 12
  - `person:81 filer:710172550 slug:brian-seaworth-944`
  - `person:606 filer:242693 slug:242693-g-brian-seaworth`
- Daniel Innis - Republican - State Senate - District 7
  - Same `person_id`, filer, and slug repeated.
- Tim McGough - Republican - State Senate - District 11
  - Same `person_id`, filer, and slug repeated.
- Kevin Avard - Republican - State Senate - District 12
  - Same `person_id`, filer, and slug repeated.
- Sharon Carson - Republican - State Senate - District 14
  - Same `person_id`, filer, and slug repeated.
- Keith Murphy - Republican - State Senate - District 16
  - Same `person_id`, filer, and slug repeated.
- Howard Pearl - Republican - State Senate - District 17
  - Same `person_id`, filer, and slug repeated.
- Victoria Sullivan - Republican - State Senate - District 18
  - Same `person_id`, filer, and slug repeated.
- Regina Birdsell - Republican - State Senate - District 19
  - Same `person_id`, filer, and slug repeated.
- Daryl Abbas - Republican - State Senate - District 22
  - Same `person_id`, filer, and slug repeated.
- Bill Gannon - Republican - State Senate - District 23
  - Same `person_id`, filer, and slug repeated.

## Possible Duplicate People / Name Variants

- Rita Jedrey-Mattson / Rita Mattson - Republican - State Representative - Cheshire District 18
- Rory Lovett Sherman / Rory Sherman - Democratic - State Representative - Cheshire District 18
- Lee Ann Kluger / Lee Kluger - Democratic - State Representative - Hillsborough District 6
- JOSE' CAMBRILS / Jose Cambrils - Republican - State Representative - Merrimack District 4
- Matthew Choiniere / Matthew Sabourin dit Choiniere - Republican - State Representative - Rockingham District 30

## Same First/Last Appearing In Multiple Districts In D1

- Dana Silcock - Republican - State Representative
  - Belknap District 4
  - Belknap District 8
- David Walker - Republican - State Representative
  - Strafford District 8
  - Strafford District 19
- Jesse Edwards - Republican - State Representative
  - District 31 with no county
  - Rockingham District 31
- Julie Gilman - Democratic - State Representative
  - Rockingham District 11
  - Rockingham District 13
- Karen Burnett-Kurie - Democratic - State Representative
  - Carroll District 6
  - Carroll District 7
- Lisa Brown - Democratic - State Representative
  - Hillsborough District 1
  - Merrimack District 28
- Lucius Parshall - Democratic - State Representative
  - Cheshire District 8
  - Cheshire District 16

## PDF Candidates Not Matched In D1

The full run found 52 candidates in the filing PDF that did not match the D1/site list. Captured examples include:

- Cody Pfaff - Republican - State Representative - Belknap District 5
- Mike Bordes - Republican - State Representative - Belknap District 5
- Timothy Minor - Republican - State Representative - Belknap District 5
- Erlon Jones - Republican - State Representative - Carroll District 2
- Morgan Bultman - Democratic - State Representative - Carroll District 5
- Aria DiMezzo - Democratic - State Representative - Cheshire District 3
- Marissa W. Salisbury - Republican - State Representative - Cheshire District 3
- Matthew Santonastaso - Republican - State Representative - Cheshire District 13
- Andrew Dorsett - Republican - State Representative - Grafton District 1
- Sheila Quick - Democratic - State Representative - Hillsborough District 2
- Pat MacMonagle - Republican - State Representative - Hillsborough District 2
- Phil Greazzo - Republican - State Representative - Hillsborough District 2
- Paul Schibbelhute - Republican - State Representative - Hillsborough District 5
- Michal B. Jakimowicz - Democratic - State Representative - Hillsborough District 15
- Ben Baroody - Democratic - State Representative - Hillsborough District 16
- James Normand - Democratic - State Representative - Hillsborough District 18
- Pauline Martineau - Democratic - State Representative - Hillsborough District 20
- W. Gordon Allen - Democratic - State Representative - Hillsborough District 30
- Kermit Williams - Democratic - State Representative - Hillsborough District 32
- Bill O'Brien - Republican - State Representative - Hillsborough District 40
- Robert Rivera - Republican - State Representative - Hillsborough District 40
- Jason Hodgdon - Republican - State Representative - Hillsborough District 41
- Michael Visconti - Republican - State Representative - Merrimack District 3
- Paul M. Little - Republican - State Representative - Merrimack District 6
- Ricky Gurung - Democratic - State Representative - Merrimack District 10
- Jonathan R. Cate - Republican - State Representative - Merrimack District 22
- Harold D. Tuttle - Democratic - State Representative - Merrimack District 26
- Jeffrey Berlin - Republican - State Senate - District 21

## D1 Candidates Not Matched In PDF

The full run found 97 D1/site candidate rows that did not match the filing PDF. Captured examples include:

- Ruth Heath - Democratic - State Representative - District 4, no county
- Jesse Edwards - Republican - State Representative - District 31, no county
- Lynn Thomas - Democratic - State Representative - Belknap District 2
- Andrew Sanborn - Democratic - State Representative - Belknap District 3
- Michael Bordes - Republican - State Representative - Belknap District 5
- Lena Nirk - Democratic - State Representative - Belknap District 6
- Stephanie Vuolo - Democratic - State Representative - Belknap District 7
- Dana Silcock - Republican - State Representative - Belknap District 8
  - Possible PDF match: Dana Silcock - Belknap District 4
- Tom Buco - Democratic - State Representative - Carroll District 1
- Meredith Bultman - Democratic - State Representative - Carroll District 5
- Karen Burnett-Kurie - Democratic - State Representative - Carroll District 6
  - Possible PDF match: Karen Burnett-Kurie - Carroll District 7
- Catherine Peternel - Republican - State Representative - Carroll District 6
- James Pittman - Democratic - State Representative - Carroll District 8
- Lucius Parshall - Democratic - State Representative - Cheshire District 8
  - Possible PDF match: Lucius Parshall - Cheshire District 16
- Sylvester Karasinski - Republican - State Representative - Cheshire District 10
- Deneen Dickler - Democratic - State Representative - Cheshire District 14
- Rory Sherman - Democratic - State Representative - Cheshire District 18
  - Possible PDF match: Rory Lovett Sherman - Cheshire District 18
- James Qualey - Republican - State Representative - Cheshire District 18
- Rita Jedrey-Mattson - Republican - State Representative - Cheshire District 18
  - Possible PDF match: Rita Mattson - Cheshire District 18

## Notes

- The repeated Senate duplicate rows appear to be a query/join duplication issue because they repeat the same `person_id`, filer number, and slug.
- The strongest cleanup candidates are the exact duplicates and the possible duplicate name variants.
- A full regenerated report requires the PDF to be accessible inside the workspace or reattached, because this resumed sandbox cannot read `/Users/randallnielsen/Downloads/cumulative-filings-6.29.26.pdf`.
