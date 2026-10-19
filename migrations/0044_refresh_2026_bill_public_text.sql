-- Generated from official New Hampshire General Court records.
-- Generated 2026-10-18T19:28:24.345Z; 69 complete rows; 0 flagged rows excluded.
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB65',
  'Directing Landlords to Offer Tenants the Option of Reporting Rental Payments to Consumer Reporting Agencies',
  'This bill provides tenants an option to have rental payments to their landlords reported to nationwide consumer reporting agencies.',
  'Interim Study Report: Not Recommended for Future Legislation 09/30/2026 (Vote 5-4; )',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Interim Study Report: Not Recommended for Future Legislation 09/30/2026 (Vote 5-4; )',
  statusdate = '2026-09-30 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB65';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB392',
  'Directing the Dissolution of the Department of Health and Human Services'' Office of Health Access and the Department of Environmental Services'' Functions for Environmental Justice',
  'This bill directs the dissolution of the department of health and human services'' office of health access and the department of environmental services'' functions for environmental justice, and requires certain programs administered by the office of health access to be transferred to other divisions or offices.',
  'Inexpedient to Legislate, MA, VV === BILL KILLED ===; 03/05/2026; SJ 5',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate, MA, VV === BILL KILLED ===; 03/05/2026; SJ 5',
  statusdate = '2026-03-05 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB392';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB570',
  'Repealing the Prescription Drug Affordability Board',
  'This bill repeals the prescription drug affordability board.',
  'Inexpedient to Legislate: MA VV 01/07/2026 HJ 1 P. 72',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate: MA VV 01/07/2026 HJ 1 P. 72',
  statusdate = '2026-01-07 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB570';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB572',
  'Establishing the "Partners in Housing" Program, an Initiative Under the Housing Champions Fund to Assist Municipalities, Counties, and Developers in Building Workforce Housing, and Making an Appropriation Therefor',
  'This bill creates the "partners in housing" program, an initiative under the housing champions fund to assist municipalities, counties, and developers in building modestly priced housing on municipally or county-owned land that is suitable for development.',
  'Inexpedient to Legislate: MA RC 191-156 01/08/2026 HJ 2 P. 6',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate: MA RC 191-156 01/08/2026 HJ 2 P. 6',
  statusdate = '2026-01-08 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB572';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB191',
  'Providing Criminal Penalties for the Transporting of an Unemancipated Minor in Order to Obtain a Surgical Procedure or a Termination of the Minor''s Pregnancy Without Parental Permission',
  'This bill provides criminal penalties for transporting an unemancipated minor without parental consent for the purpose of obtaining a surgical procedure or a termination of the minor’s pregnancy.',
  'Sen. Gannon Refused to Accede to House Request for Committee of Conference, MA, VV; 05/07/2026; SJ 11',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Sen. Gannon Refused to Accede to House Request for Committee of Conference, MA, VV; 05/07/2026; SJ 11',
  statusdate = '2026-05-07 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB191';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'SB211',
  'Biological Sex in Student Athletics',
  'This bill requires school sports teams to be expressly designated as male, female, or coed, prohibits biologically male students from participating in female designated sports or entering female locker rooms, and creates a cause of action for athletes harmed as a result of violations of these requirements.',
  'Inexpedient to Legislate: MA VV 01/07/2026 HJ 1 P. 50',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate: MA VV 01/07/2026 HJ 1 P. 50',
  statusdate = '2026-01-07 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'SB211';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB222',
  'Repealing the Requirement for a Memorandum of Understanding Between a Chartered Public School and School District Regarding How Students with Disabilities Will Receive Special Education Services and Updating the Organizational Structure of the Department of Corrections',
  'This bill repeals the requirement for a memorandum of understanding between a chartered public school and school district regarding how students with disabilities will receive special education services. This bill also updates the organizational structure of the department of corrections.',
  'Signed by Governor Ayotte 04/28/2026; Chapter 41; eff. I. Sec 1 eff 6/27/26 II. Rem eff 4/28/26',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Signed by Governor Ayotte 04/28/2026; Chapter 41; eff. I. Sec 1 eff 6/27/26 II. Rem eff 4/28/26',
  statusdate = '2026-04-28 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB222';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'SB33',
  'The Regulation of Public School Materials',
  'This bill requires local school districts to adopt and publicly post policies describing materials authorized for use by students in the district and outlining procedures to address complaints alleging that material is harmful or age-inappropriate for use in the district''s schools.',
  'Sen. Ward Moved Nonconcur with the House Amendment, MA, VV; 02/05/2026; SJ 3',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Sen. Ward Moved Nonconcur with the House Amendment, MA, VV; 02/05/2026; SJ 3',
  statusdate = '2026-02-05 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'SB33';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB751',
  'Establishing a Committee to Study Licensure of Outpatient Substance Use Disorder Treatment Facilities, Authorizing Parents to Enroll Their Children in Any Public School in the State, and Creating a Limited Exemption from Parental Consent Required for Certain Recordings Under the Parental Bill of Rights',
  'Establishes a committee to study licensure of outpatient substance use disorder treatment facilities. Allows parents to send their children to public schools outside of their resident district. Creates a limited exemption from the consent requirement under the parental bill of rights for required assessments and school-sponsored events open to the general public.',
  'Sen. Pearl Moved Laid on Table, MA, VV; 06/04/2026; SJ 14',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Sen. Pearl Moved Laid on Table, MA, VV; 06/04/2026; SJ 14',
  statusdate = '2026-06-04 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB751';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB665',
  'Eligibility for Free School Meals',
  'This bill increases the eligibility for free school meals to household incomes up to 300 percent of federal poverty guidelines, and provides funding from the education trust fund for the additional costs.',
  'Inexpedient to Legislate: MA RC 189-158 01/07/2026 HJ 1 P. 120',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate: MA RC 189-158 01/07/2026 HJ 1 P. 120',
  statusdate = '2026-01-07 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB665';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB360',
  'Prohibiting Public Schools from Performing Surgical Procedures or Prescribing Pharmaceutical Drugs, Relative to Licensing Requirements for Health Care Facilities Established Within a 15 Mile Radius of a Critical Access Hospital, and Relative to the Administration of Prescription Medication to Minors by Youth Camp Staff',
  'Prohibits public schools from performing surgical procedures or prescribing pharmaceutical drugs. Requires a health care facility to provide certified, written notice to a critical access hospital if the facility will be located within a 15 mile radius of the critical access hospital. Allows youth camps licensed under this chapter to administer pharmaceutical drugs to minors with the written authorization of a parent or guardian.',
  'Conference Committee Report; Not Signed Off; SJ 14',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Conference Committee Report; Not Signed Off; SJ 14'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB360';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB365',
  'Proof of United States Citizenship for Indigent Voters',
  'This bill provides a procedure for local election officials and the secretary of state to verify the citizenship of a voter who does not have documentary proof of citizenship. This bill also creates a voucher program for local election officials to give to indigent voters who cannot afford the cost of obtaining a birth certificate, requires the secretary of state to reimburse the municipality for the issuance of such vouchers, and makes an appropriation therefor.',
  'Signed by Governor Ayotte 05/18/2026; Chapter 68; eff.07/17/2026',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Signed by Governor Ayotte 05/18/2026; Chapter 68; eff.07/17/2026',
  statusdate = '2026-05-18 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB365';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB314',
  'Prohibiting the Use of Federal, State, or Local Funds for Lobbying Activities',
  'This bill regulates the use of public funds for lobbying activities and establishes certain additional enforcement mechanisms.',
  'Inexpedient to Legislate: MA DV 203-147 01/08/2026 HJ 2 P. 56',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate: MA DV 203-147 01/08/2026 HJ 2 P. 56',
  statusdate = '2026-01-08 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB314';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB155',
  'Business Enterprise Tax Returns and Appropriating Funds to the Department of Health and Human Services for Licensed Nursing Facilities',
  'Raises the amount of income needed before businesses are required to file a business enterprise tax return with the department of revenue administration. Appropriates funds to the department of health and human services for certain nursing facilities. Reduces the rate of the business enterprise tax in the event of certain business tax revenue surpluses.',
  'Signed by Governor Ayotte 07/10/2026; Chapter 280; eff. I. Sec 2 eff 6/30/2026 II. Rem eff 1/1/2027',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Signed by Governor Ayotte 07/10/2026; Chapter 280; eff. I. Sec 2 eff 6/30/2026 II. Rem eff 1/1/2027',
  statusdate = '2026-07-10 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB155';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB707',
  'Establishing a Solid Waste Site Evaluation Committee',
  'This bill establishes a solid waste site evaluation committee.',
  'Signed by Governor Ayotte 07/10/2026; Chapter 288; eff. 9/8/2026',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Signed by Governor Ayotte 07/10/2026; Chapter 288; eff. 9/8/2026',
  statusdate = '2026-07-10 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB707';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB709',
  'Allowing Parents or Guardians to Admit Their Children Into Any School District Where They Pay Any Property or School District Taxes',
  'This bill allows parents or guardians to admit their children into any school district where they pay any property tax or school district taxes.',
  'Inexpedient to Legislate, MA, VV === BILL KILLED ===; 03/12/2026; SJ 6',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate, MA, VV === BILL KILLED ===; 03/12/2026; SJ 6',
  statusdate = '2026-03-12 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB709';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB396',
  'The Processing of Cattle, Swine, Sheep, and Goats at Facilities Not Certified by the United States Department of Agriculture',
  'This bill allows for a limited number of cattle, swine, sheep, and goats to be processed per month by a farm or a producer at a facility that is not certified by the United States Department of Agriculture.',
  'Veto Sustained 08/19/2026: RC 202-107 Lacking Necessary Two-Thirds Vote HJ 16 P. 42',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Veto Sustained 08/19/2026: RC 202-107 Lacking Necessary Two-Thirds Vote HJ 16 P. 42',
  statusdate = '2026-08-19 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB396';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'SB204',
  'The Responsibility of Local School Districts to Provide Meals to Students During School Hours, Reimbursing Schools for Meals Provided to Students at No Cost, and Making an Appropriation Therefor',
  'This bill authorizes school boards to raise eligibility for free meals, requires the department of education to reimburse schools who raise eligibility, and provides an appropriation therefor.',
  'Inexpedient to Legislate: MA RC 183-161 01/07/2026 HJ 1 P. 123',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate: MA RC 183-161 01/07/2026 HJ 1 P. 123',
  statusdate = '2026-01-07 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'SB204';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'SB513',
  'The Hiring of an Owner''s Project Manager (OPM) for Construction or Renovation Projects Which Utilize School Building Aid',
  'Permits schools to hire an owner''s project manager (OPM) before entering into a contract for design services in order for an OPM to represent a school throughout the design process. Requires that a hired OPM maintain no contractual conflicts of interest with any architect, design team member, or general contractor hired by a school for a construction or reconstruction/renovation project. Increases the threshold cost for projects where a school district or chartered public school is required to hire an OPM.',
  'Sen. Murphy Moved Nonconcur with the House Amendment, MA, VV; 05/14/2026; SJ 12',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Sen. Murphy Moved Nonconcur with the House Amendment, MA, VV; 05/14/2026; SJ 12',
  statusdate = '2026-05-14 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'SB513';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'CACR12',
  'The House of Representatives May Not Adopt Based on Personal Income',
  'This constitutional amendment concurrent resolution prohibits the house of representatives from adopting any tax on personal income.',
  'Ought to Pass with Amendment 2026-1134h: MF RC 193-148 Lacking Necessary Three-Fifths Vote 05/14/2026 HJ 13 P. 63',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Ought to Pass with Amendment 2026-1134h: MF RC 193-148 Lacking Necessary Three-Fifths Vote 05/14/2026 HJ 13 P. 63',
  statusdate = '2026-05-14 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'CACR12';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'SB634',
  'Enabling Municipalities to Adopt a Municipal Occupancy Fee',
  'This bill enables a municipality to collect an occupancy fee from room rentals for the purpose of establishing a municipal capital fund, revolving fund, or tourism support fund.',
  'Inexpedient to Legislate, RC 15Y-9N, MA === BILL KILLED ===; 01/29/2026; SJ 2',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate, RC 15Y-9N, MA === BILL KILLED ===; 01/29/2026; SJ 2',
  statusdate = '2026-01-29 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'SB634';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1196',
  'Repealing the State Housing Champion Designation and Grant Program',
  'This bill repeals the housing champion designation and grant program.',
  'Inexpedient to Legislate, MA, VV === BILL KILLED ===; 04/23/2026; SJ 10',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate, MA, VV === BILL KILLED ===; 04/23/2026; SJ 10',
  statusdate = '2026-04-23 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1196';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1811',
  'Repealing Statutory Immunization Requirements for Children',
  'This bill repeals immunization requirements for children, including requirements regarding religious and medical exemptions, recordkeeping by schools and child care agencies, and rulemaking.',
  'Inexpedient to Legislate: MA VV 02/19/2026 HJ 5 P. 80',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate: MA VV 02/19/2026 HJ 5 P. 80',
  statusdate = '2026-02-19 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1811';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1719',
  'Removing Hepatitis B from the List of Diseases for Which Immunization Is Required Under State Law',
  'This bill removes Hepatitis B from the list of diseases for which childhood immunization is required.',
  'Refer to Interim Study, MA, VV; 05/07/2026; SJ 11',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Refer to Interim Study, MA, VV; 05/07/2026; SJ 11',
  statusdate = '2026-05-07 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1719';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1773',
  'Food and Drink Purchased Under SNAP, the Supplemental Nutritional Assistance Program',
  'This bill directs the department of health and human services to submit a waiver to the United States Department of Agriculture to prohibit the purchase of sweetened drinks and candy under SNAP.',
  'Inexpedient to Legislate: MA VV 03/11/2026 HJ 7 P. 210',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate: MA VV 03/11/2026 HJ 7 P. 210',
  statusdate = '2026-03-11 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1773';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1831',
  'Repealing the Education Trust Fund Targeted Aid Cap',
  'This bill repeals the funding cap on targeted aid for purposes of determining education adequacy grants.',
  'Died on Table, Session ended 08/19/2026 HJ 16',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Died on Table, Session ended 08/19/2026 HJ 16',
  statusdate = '2026-08-19 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1831';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1563',
  'The Special Education Aid Formula and the Administration and Monitoring of State Special Education Aid',
  'Requires the department of education to distribute aid to school districts for pupils whose special education costs exceed a certain dollar value, but only up to a certain threshold. Creates considerations for calculating costs associated with a special education student''s education. Requires each school district seeking special education aid reimbursements to submit a certified report for each student for whom reimbursement is requested.',
  'Signed by Governor Ayotte 07/02/2026; Chapter 232; eff. 7/1/2028',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Signed by Governor Ayotte 07/02/2026; Chapter 232; eff. 7/1/2028',
  statusdate = '2026-07-02 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1563';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1792',
  'The Prohibition on Teaching Discrimination',
  'This bill requires that educators must act purposefully in academic instruction in order for their actions to constitute teaching discrimination. This bill also removes the ability for aggrieved parties to both initiate a civil action against a school or school district and to pursue a remedy through the New Hampshire commission for human rights.',
  'House Non-Concurs with Senate Amendment 2026-1779h (Rep. Balboni): MA VV 05/21/2026 HJ 14 P. 10',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'House Non-Concurs with Senate Amendment 2026-1779h (Rep. Balboni): MA VV 05/21/2026 HJ 14 P. 10',
  statusdate = '2026-05-21 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1792';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1570',
  'Governmental Budget Authority for Agreements for Law Enforcement Agencies to Participate in Federal Immigration Enforcement',
  'This bill requires local budgetary authority before a law enforcement agency enters into an agreement with the federal Immigration and Customs Enforcement to assist in the enforcement of federal immigration law, grants the budgetary authority continuing power to terminate the agreement, and provides for a penalty for failure to comply.',
  'Inexpedient to Legislate: MA RC 198-161 02/12/2026 HJ 4 P. 17',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate: MA RC 198-161 02/12/2026 HJ 4 P. 17',
  statusdate = '2026-02-12 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1570';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1499',
  'Additional Grounds for Eviction Under the Landlord and Tenant Statute, Relative to the Responsibility of Local School Districts to Provide Meals to Students During School Hours, and Reimbursing Schools for Meals Provided to Students at No Cost and Making an Appropriation Therefor',
  'Allows eviction if a tenant uses someone else’s personal information to obtain the rental or if the tenant or an occupant has certain criminal convictions, including improper entry as a non-citizen or a conviction requiring registration as a sexual offender or offender against children. The landlord cannot use a conviction disclosed in writing before the start of the tenancy as grounds for eviction. Authorizes school boards to raise eligibility for free meals, requires the department of education to reimburse schools who raise eligibility, and provides an appropriation therefor.',
  'Conference Committee Report; Not Signed Off; SJ 14',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Conference Committee Report; Not Signed Off; SJ 14'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1499';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1706',
  'Repealing the Refugee Resettlement Program in the Department of Health and Human Services and Prohibiting Expenditure of State Funds on Refugee Resettlement',
  'This bill repeals the refugee resettlement program in the department of health and human services and prohibits expenditure of state funds on refugee resettlement.',
  'Inexpedient to Legislate, MA, VV === BILL KILLED ===; 04/16/2026; SJ 9',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate, MA, VV === BILL KILLED ===; 04/16/2026; SJ 9',
  statusdate = '2026-04-16 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1706';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'CACR10',
  'The House of Representatives May Not Adopt Based on Income',
  'This constitutional amendment concurrent resolution prohibits the state legislature from adopting and the state from collecting any tax on personal income that was not in effect on January 1, 2026.',
  '==CANCELLED== Public Hearing: 03/09/2026 10:45 am GP 159',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = '==CANCELLED== Public Hearing: 03/09/2026 10:45 am GP 159',
  statusdate = '2026-03-09 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'CACR10';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1822',
  'Reporting of Civil Immigration Detentions by State, County, and Local Law Enforcement and Correctional Facilities',
  'This bill requires semi-annual reporting regarding the number of individuals detained for civil immigration violations by any state, county, or local law enforcement or correctional facility.',
  'Died on Table, Session ended 08/19/2026 HJ 16',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Died on Table, Session ended 08/19/2026 HJ 16',
  statusdate = '2026-08-19 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1822';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1487',
  'Creating an Independent Commission to Propose Redistricting Maps for the Legislature to Consider',
  'This bill creates an independent commission to propose redistricting maps for the legislature to consider.',
  'Inexpedient to Legislate: MA RC 189-164 02/05/2026 HJ 3 P. 39',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate: MA RC 189-164 02/05/2026 HJ 3 P. 39',
  statusdate = '2026-02-05 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1487';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1708',
  'Statewide Education Property Taxes and Other Tax Revenues',
  'Directs the department of revenue administration to reduce the statewide education property tax rate at a level that would be offset by increases in business-related taxes. Increases the rate of the business profits tax. Deposits the additional revenues in the education trust fund.',
  'Special Order to next order of business (Rep. Malone): MF RC 156-195 03/12/2026 HJ 8 P. 58',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Special Order to next order of business (Rep. Malone): MF RC 156-195 03/12/2026 HJ 8 P. 58',
  statusdate = '2026-03-12 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1708';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1709',
  'Prohibiting Certain Unlawfully Present Felons from Occupying or Renting Real Property, Relative to Pet Vendor Foster Home and Defining Pet Vendor Foster Facility, and Providing Procedures for the Potential Confiscation of Livestock Involved in Cruelty to Animal Cases',
  'Prohibits certain unlawfully present aliens with prior felony convictions from occupying or renting real property and authorizes sheriffs to arrest such individuals during service of a writ of possession. Includes a determination of the best interest of the animal in the definition of pet vendor foster home. Defines a pet vendor foster facility. Requires all pet vendors to annually report on associated pet vendor foster homes to the department of agriculture, markets, and food to ensure compliance with licensure, animal inventory, and applicable pet limit requirements. Provides procedures for the potential confiscation of livestock involved in cruelty to animal cases.',
  'Sen. Pearl Moved Laid on Table, MA, VV; 06/04/2026; SJ 14',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Sen. Pearl Moved Laid on Table, MA, VV; 06/04/2026; SJ 14',
  statusdate = '2026-06-04 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1709';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HCR13',
  'Requesting Congress to Call a Constitutional Convention Relative to Implementing Term Limits for Elected Members of Both Houses of Congress',
  'This resolution applies for a convention of the states under Article V of the Constitution of the United States for the purpose of establishing term limits for elected members of both houses of Congress.',
  'Died on Table, Session ended 08/19/2026 HJ 16',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Died on Table, Session ended 08/19/2026 HJ 16',
  statusdate = '2026-08-19 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HCR13';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1484',
  'Establishing a State Minimum Wage and Providing for Incremental Increases',
  'This bill establishes a state minimum wage and provides for incremental increases.',
  'Died on Table, Session ended 08/19/2026 HJ 16',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Died on Table, Session ended 08/19/2026 HJ 16',
  statusdate = '2026-08-19 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1484';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1217',
  'Permitting Classification of Individuals Based on Biological Sex Under Certain Limited Circumstances',
  'This bill permits the public and private classification of individuals based on biological sex in multi-user lavatory facilities and in athletic competitions where biological males have a competitive advantage. The bill also establishes that these forms of separation based on biological sex do not qualify as discrimination.',
  'Pending Motion Ought to Pass; 05/07/2026; SJ 11',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Pending Motion Ought to Pass; 05/07/2026; SJ 11',
  statusdate = '2026-05-07 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1217';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1449',
  'Limiting Times Vaccine Clinics May Operate at Schools, with Certain Exceptions',
  'This bill prohibits the operation of a vaccination clinic at schools during school hours with the exception of clinics which solely administer influenza vaccinations and clinics operating during public health emergencies.',
  'House Non-Concurs with Senate Amendment 2026-1426s (Rep. W. MacDonald): MA VV 05/21/2026 HJ 14 P. 11',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'House Non-Concurs with Senate Amendment 2026-1426s (Rep. W. MacDonald): MA VV 05/21/2026 HJ 14 P. 11',
  statusdate = '2026-05-21 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1449';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1299',
  'Permitting Classification of Individuals Based on Biological Sex Under Certain Limited Circumstances and Establishing That Certain Biological Sex Distinctions Do Not Qualify as Discrimination',
  'Permits classification of individuals based on biological sex in lavatory facilities and locker rooms, sporting competitions, and detention facilities. Establishes that such forms of separation based on biological sex do not qualify as discrimination. Requires instrumentalities of state or local government that classify lavatory facilities based on biological sex also provide a single occupancy bathroom which may be used by all regardless of biological sex or gender identity.',
  'Pending Motion Ought to Pass; 05/07/2026; SJ 11',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Pending Motion Ought to Pass; 05/07/2026; SJ 11',
  statusdate = '2026-05-07 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1299';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1557',
  'Modifying the State Average Expenditure Per Pupil Relative to Students in Special Education',
  'This bill modifies the required state aid to be provided to school districts for the costs of special education. The bill also removes the proration of such appropriations relative to the costs of special education for each fiscal year.',
  'Inexpedient to Legislate: MA RC 184-157 02/19/2026 HJ 5 P. 39',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate: MA RC 184-157 02/19/2026 HJ 5 P. 39',
  statusdate = '2026-02-19 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1557';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1452',
  'Parent-taught Driver Education as an Alternative to Traditional Driver Education Programs',
  'This bill allows the commissioner to waive the driver education course requirement for youth operator license applicants if a parent, guardian, or other responsible adult provides equivalent instruction and training.',
  'Inexpedient to Legislate: MA RC 178-155 02/05/2026 HJ 3 P. 59',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate: MA RC 178-155 02/05/2026 HJ 3 P. 59',
  statusdate = '2026-02-05 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1452';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1573',
  'Permitting Excused Absences for Student Participation in Certain Activities and Mandating the State Board of Education to Grant School Reassignment Requests for Students Demonstrating a Manifest Educational Hardship',
  'Permits excused absences for students that are participating in civic engagement activities and career or technical education (CTE) activities so long as parental notice is provided to schools and other requirements are met. Directs the state board of education to develop rules, a list of recognized CTE organizations, and alternative academic credits relative to participation in civic or CTE activities. Mandates that the state board of education, on appeal, grant a parent''s or guardian''s request to re-assign their student to another public school, public academy, or an approved private school where such parent or guardian demonstrates the student has a manifest educational hardship. Adds a statutory cross-reference to the exceptions for legal residence requirements relative to school attendance.',
  'Signed by Governor Ayotte 07/10/2026; Chapter 307; eff. I. Secs 1.2.5.6 eff prov sec 7 II. Rem eff 7/10/2026',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Signed by Governor Ayotte 07/10/2026; Chapter 307; eff. I. Secs 1.2.5.6 eff prov sec 7 II. Rem eff 7/10/2026',
  statusdate = '2026-07-10 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1573';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1661',
  'Expanding the Housing Finance Authority''s Community Heroes Program and Makes an Appropriation Therefor',
  'This bill directs the housing finance authority to establish a community heroes program.',
  'Inexpedient to Legislate: MA RC 179-166 02/05/2026 HJ 3 P. 50',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate: MA RC 179-166 02/05/2026 HJ 3 P. 50',
  statusdate = '2026-02-05 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1661';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1578',
  'Adds Definitions and Reporting Requirements Relative to Education Freedom Accounts',
  'This bill adds definitions to the chapter relative to education freedom accounts (EFAs), including a definition for program administrator. The bill also adds quarterly reporting requirements for program administrators detailing information related to EFAs.',
  'Died on Table, Session ended 08/19/2026 HJ 16',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Died on Table, Session ended 08/19/2026 HJ 16',
  statusdate = '2026-08-19 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1578';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1219',
  'Immunization Requirements in Foster Family Homes and Relative to Financial Eligibility for the Medicare Savings Program',
  'Provides that vaccination requirements for adults residing in foster homes shall not exceed the vaccination requirements of RSA 141-C:20-a, either in type of vaccination, quality of doses, or authorization for exemption. Removes the resource limit for the Medicare savings program and, subject to CMS approval, makes the low income subsidy for Medicare Part D available to residents to assist with prescription drug costs.',
  'Law Without Signature 07/07/2026; Chapter 279; eff. 9/5/2026',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Law Without Signature 07/07/2026; Chapter 279; eff. 9/5/2026',
  statusdate = '2026-07-07 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1219';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1313',
  'Repealing Buffer Zones for Reproductive Health Care Facilities',
  'This bill repeals the prohibition on entering or remaining on a public way or sidewalk adjacent to a reproductive health care facility.',
  'Inexpedient to Legislate: MA RC 171-163 03/11/2026 HJ 7 P. 238',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate: MA RC 171-163 03/11/2026 HJ 7 P. 238',
  statusdate = '2026-03-11 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1313';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1797',
  'Eligibility for Public Assistance, Including the New Hampshire Employment Program, Family Assistance Program, and SNAP',
  'Strengthens work requirements for SNAP eligibility. Directs the department of health and human services to enter into data-sharing agreements with other state agencies to verify SNAP benefit eligibility. Directs the department to verify eligibility of enrollees that make exclusively out-of-state purchases. Prohibits the department from using their discretion to set more lenient standards for SNAP eligibility or exemptions than those outlined in federal law.',
  'Refer to Interim Study, MA, VV; 05/07/2026; SJ 11',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Refer to Interim Study, MA, VV; 05/07/2026; SJ 11',
  statusdate = '2026-05-07 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1797';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1337',
  'Repealing the New Hampshire Council on Autism Spectrum Disorders',
  'This bill repeals the New Hampshire council on autism spectrum disorders.',
  'Veto Sustained 08/19/2026: RC 148-172 Lacking Necessary Two-Thirds Vote HJ 16',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Veto Sustained 08/19/2026: RC 148-172 Lacking Necessary Two-Thirds Vote HJ 16',
  statusdate = '2026-08-19 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1337';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1405',
  'The Housing Finance Authority''s Affordable Housing Guarantee Program',
  'Establishes an affordable housing guarantee program within the housing finance authority to promote affordable housing for low- and moderate-income persons. Requires the housing finance authority to offer loan guarantees to lenders who have current approval to provide financing through the housing finance authority to reduce the risk of their loans.',
  'Inexpedient to Legislate: MA RC 186-162 02/05/2026 HJ 3 P. 45',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate: MA RC 186-162 02/05/2026 HJ 3 P. 45',
  statusdate = '2026-02-05 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1405';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1596',
  'The Collection of Certain Health Care Program Premiums; Funding for the University System of New Hampshire; and Raising the Tobacco Tax',
  'Raises the tobacco tax. Appropriates moneys to the university system of New Hampshire. Repeals the collection of certain healthcare premiums.',
  'Inexpedient to Legislate: MA RC 200-157 02/12/2026 HJ 4 P. 33',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate: MA RC 200-157 02/12/2026 HJ 4 P. 33',
  statusdate = '2026-02-12 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1596';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1735',
  'The Practice of Pharmacy, the Dispensing of Certain Medications by Pharmacists, and Permitting Treatment of Certain Severe Illness Under the Right to Try Act',
  'Authorizes the dispensing of up to a 30-day supply of noncontrolled oral anti-cancer medication by a licensed health care professional legally authorized to prescribe and administer medications to a patient under a provider''s care or supervision subject to certain conditions. Amends the display requirements for certain licenses and permits. Authorizes licensed advanced pharmacy technicians to engage in remote processing. Removes the requirement that a pharmacist''s name or initials be on a label affixed to any controlled drug or prescription issued. Amends the definition of the "practice of pharmacy." Removes certain authority of the board of pharmacy with respect to the regulation of collaborative pharmacy practice agreements. Limits any examination requirement for licensure as an advanced pharmacy technician to scope of practice. Prohibits the pharmacy board from testing applicants on pharmacy jurisprudence or law. Allows supervised certified pharmacy technicians to administer vaccines, and eliminates a requirement that vaccines be recommended by the United States Center for Disease Control and Prevention Advisory Committee on Immunization Practices before being administered by pharmacists, pharmacy interns, licensed advanced pharmacy technicians, or certified pharmacy technicians. Permits treatment of certain severe illness under the right to try act and directs the department of health and human services to adopt any rules necessary to implement the act. The bill also makes amendment of the act contingent upon a report by the department and approval by the fiscal committee.',
  'Signed by Governor Ayotte 07/10/2026; Chapter 311; eff. I. Sec 14-19 eff prov sec 21 II. Secs 1-13 eff 9/8/2026 III. Rem eff 7/10/2026',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Signed by Governor Ayotte 07/10/2026; Chapter 311; eff. I. Sec 14-19 eff prov sec 21 II. Secs 1-13 eff 9/8/2026 III. Rem eff 7/10/2026',
  statusdate = '2026-07-10 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1735';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1317',
  'Patient Privacy Protections',
  'This bill provides that no state agency, political subdivision, contractor, vendor, or grant recipient shall collect, maintain, or disclose personally identifiable medical, disability, or mental health data to the federal government or any third party, except in limited circumstances as permitted under state and federal law.',
  'Died on Table, Session ended 08/19/2026 HJ 16',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Died on Table, Session ended 08/19/2026 HJ 16',
  statusdate = '2026-08-19 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1317';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1635',
  'Modifying the Requirements of Suicide Prevention Education Policies in Schools',
  'The bill requires that suicide prevention training occur within 30 days of personnel being hired as well as every 2 years thereafter.',
  'Inexpedient to Legislate, MA, VV === BILL KILLED ===; 04/16/2026; SJ 9',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate, MA, VV === BILL KILLED ===; 04/16/2026; SJ 9',
  statusdate = '2026-04-16 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1635';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1636',
  'Directing the Department of Revenue Administration to Study Options for Generating State Revenue',
  'This bill requires the department of revenue administration to study options for generating state revenue and directs the department to submit to certain entities and the public a report detailing a menu of revenue options to raise additional state funds.',
  'Inexpedient to Legislate: MA RC 284-76 02/12/2026 HJ 4 P. 27',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate: MA RC 284-76 02/12/2026 HJ 4 P. 27',
  statusdate = '2026-02-12 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1636';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1716',
  'The Academic Accountability of Education Freedom Accounts',
  'This bill requires that records of educational attainment for students participating in the education freedom account program be reported to the department of education. The bill also directs the division of learner support within the department of education to develop a rubric for educational attainment portfolios and to compile data obtained from all records of educational attainment.',
  'Inexpedient to Legislate: MA RC 194-166 02/12/2026 HJ 4 P. 24',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate: MA RC 194-166 02/12/2026 HJ 4 P. 24',
  statusdate = '2026-02-12 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1716';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1376',
  'A Parent''s Ability to Raise Their Child in a Manner Consistent with the Child''s Biological Sex and Relative to Breast Surgeries for Minors',
  'Exempts child rearing consistent with the child''s biological sex from being considered within the definitions of abused child and endangering child welfare. Removes child rearing consistent with the child''s biological sex from being a basis for findings relative to family law determinations, including: adoptions, child-placing agency licensing, and best interests of the child determinations.',
  'Signed by Governor Ayotte 07/15/2026; Chapter 326; eff.09/13/2026',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Signed by Governor Ayotte 07/15/2026; Chapter 326; eff.09/13/2026',
  statusdate = '2026-07-15 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1376';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1642',
  'Extreme Risk Protection Orders',
  'This bill establishes a procedure for issuing extreme risk protection orders to protect against persons who pose an immediate risk of harm to themselves or others.',
  'Inexpedient to Legislate: MA RC 206-153 02/12/2026 HJ 4 P. 19',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate: MA RC 206-153 02/12/2026 HJ 4 P. 19',
  statusdate = '2026-02-12 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1642';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1675',
  'Establishing a Commission to Investigate the New Hampshire Coalition Against Sexual and Domestic Violence and Requiring Funding Only Be Provided for the Direct Services Materially Benefitting Survivors of Sexual and Domestic Assault',
  'This bill establishes a commission to investigate the New Hampshire Coalition Against Sexual and Domestic Violence, subjects the coalition to annual audits, requiring funding only be provided to the coalition for services materially benefitting survivors of sexual and domestic assault, and removes the coalition''s membership on any state commissions.',
  'Died on Table, Session ended 08/19/2026 HJ 16',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Died on Table, Session ended 08/19/2026 HJ 16',
  statusdate = '2026-08-19 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1675';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1356',
  'The Statute of Limitations for Bringing a Private Right of Action for Violation of the Statute Prohibiting Medical Procedures and Treatments Intended to Alter a Minor''s Gender, Authorizing the Application of Sunscreen in Schools and Camps Without a Licensed Health Care Provider''s Note or Prescription, and Establishing a Skin Cancer Prevention Education Program',
  'Extends the time period to file a claim for violation of the prohibition on medical procedures intended to change a minor''s gender from 2 years to 10 years from the date the minor reaches the age of majority. Permits the self-application of sunscreen by children in schools and camps without the requirement of a prescription or a licensed health care provider''s note. Authorizes specific school and camp personnel to apply sunscreen to a child with permission of the child''s parent or guardian. Establishes a skin cancer prevention education program in public schools.',
  'Conference Committee Report; Not Signed Off; SJ 14',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Conference Committee Report; Not Signed Off; SJ 14'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1356';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1799',
  'Required State Funding for Providing an Opportunity for an Adequate Education',
  'Creates a new set of standards for what the legislature determines as the meaning of a constitutionally adequate education. Includes a variety of staffing and personnel roles as pieces of an adequate education that should be funded appropriately. Increases the costs associated with funding an adequate education. Requires the state and school districts to establish means and goals of addressing educational outcome disparities. Creates a commission to study alternative methods of funding public schools besides property taxes.',
  'Inexpedient to Legislate: MA RC 185-159 02/19/2026 HJ 5 P. 47',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate: MA RC 185-159 02/19/2026 HJ 5 P. 47',
  statusdate = '2026-02-19 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1799';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1824',
  'School District Financial Distress',
  'Authorizes the commissioner of the department of education, with the affirmation of the joint legislative fiscal committee, to enter into loan agreements with financially insolvent school districts. Authorizes municipalities to provide financially insolvent school districts with assistance from existing municipal funds and increases the maximum percentage of funding available to such school districts through a contingency fund. Establishes the school district adequacy revolving loan fund to assist school districts with cash flow in anticipation of adequacy payments.',
  'Special Order to next order of business (Rep. Damon): MF RC 151-180 03/11/2026 HJ 7 P. 103',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Special Order to next order of business (Rep. Damon): MF RC 151-180 03/11/2026 HJ 7 P. 103',
  statusdate = '2026-03-11 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1824';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1793',
  'Prohibiting Public Colleges and Universities from Regulating the Possession or Carrying of Certain Weapons on Campus and Establishing a Committee to Study the Feasibility of Allowing Guns on Campuses of Public Institutions of Higher Education',
  'Prohibits public colleges and universities from regulating the possession or carrying of non-lethal weapons on campus or firearms on campus by faculty and requires such institutions to enact rules, policies, and procedures regarding the prohibition. Establishes a committee to study campus carry and the possession, carrying, and storage of firearms on college campuses.',
  'Sen. Gannon Refused to Accede to House Request for Committee of Conference, MA, VV; 05/21/2026; SJ 13',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Sen. Gannon Refused to Accede to House Request for Committee of Conference, MA, VV; 05/21/2026; SJ 13',
  statusdate = '2026-05-21 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1793';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1704',
  'Permitting Public Employees to Bargain Individually with Public Employers Without Any Intervention',
  'This bill provides certain public employees with independent bargaining rights and authorizes said employees to engage in independent bargaining with employers free of any interference. The bill also establishes penalties for any violations of these public employee''s independent bargaining rights.',
  'Indefinitely Postpone (Rep. B. Sullivan): MA RC 177-159 03/11/2026 HJ 7 P. 245',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Indefinitely Postpone (Rep. B. Sullivan): MA RC 177-159 03/11/2026 HJ 7 P. 245',
  statusdate = '2026-03-11 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1704';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1820',
  'Requiring the Department of Education to Administer the Education Freedom Account Program',
  'This bill changes the administration of the education freedom account program under RSA 194-F from scholarship organizations to the department of education.',
  'Died on Table, Session ended 08/19/2026 HJ 16',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Died on Table, Session ended 08/19/2026 HJ 16',
  statusdate = '2026-08-19 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1820';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1834',
  'The Education Freedom Account Enrollment Cap',
  'This bill limits the number of education freedom accounts allowed through 2027.',
  'Died on Table, Session ended 08/19/2026 HJ 16',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Died on Table, Session ended 08/19/2026 HJ 16',
  statusdate = '2026-08-19 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1834';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1580',
  'The Taxation of Non-primary Residences',
  'This bill creates a tax against properties that do not act as primary residences.',
  'Inexpedient to Legislate: MA RC 284-55 02/12/2026 HJ 4 P. 71',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Inexpedient to Legislate: MA RC 284-55 02/12/2026 HJ 4 P. 71',
  statusdate = '2026-02-12 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1580';
INSERT INTO d1_bill_overrides (
  sessionyear,
  condensedbillno,
  title,
  summary,
  description,
  updated_by,
  updated_at
) VALUES (
  2026,
  'HB1584',
  'Directing the Department of Health and Human Services to Provide Notice of Medical and Religious Exemptions from Immunization Requirements and Relative to Notice of Drug Pricing Options',
  'Directs the department of health and human services to include in certain materials relative to childhood immunization requirements a statement indicating that medical and religious exemptions to such requirements are available under state law. Requires pharmacies to make efforts to notify consumers of their right to request the lowest available price for prescription drugs.',
  'Signed by Governor Ayotte 07/15/2026; Chapter 328; eff. I. Sec I eff 10/13/2026 II. Rem eff 01/01/2027',
  'official-nh-general-court-refresh',
  CURRENT_TIMESTAMP
) ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  updated_by = excluded.updated_by,
  updated_at = CURRENT_TIMESTAMP;
UPDATE d1_bills
SET
  description = 'Signed by Governor Ayotte 07/15/2026; Chapter 328; eff. I. Sec I eff 10/13/2026 II. Rem eff 01/01/2027',
  statusdate = '2026-07-15 00:00:00'
WHERE sessionyear = 2026
  AND UPPER(condensedbillno) = 'HB1584';
