# 2026 primary-loser archive audit

Audit date: September 10, 2026  
Election date: September 8, 2026

## Scope

This audit records candidates archived after the 2026 New Hampshire Democratic and Republican state primaries. A candidate was changed only when the Associated Press result embedded by NHPR marked the contested race as `Called` and did not mark that candidate as a winner or runoff candidate. Write-in totals were excluded as candidates.

Sources:

- [NHPR Democratic State House and Senate results](https://www.nhpr.org/elections/primary-2026/results/dem-state-house-senate)
- [NHPR Republican State House and Senate results](https://www.nhpr.org/elections/primary-2026/results/gop-state-house-senate)
- [New Hampshire Secretary of State 2026 primary results](https://www.sos.nh.gov/2026-state-primary-election-results)

## Changes applied

- Added 43 records to `d1_candidate_primary_results`.
- Changed 43 2026 candidate roles from `active` to `lost_primary`.
- Recalculated `d1_people.is_2026_candidate` so these candidates are excluded from current-candidate search and indexing.
- Stored votes, percentage, total contest votes, seats available, AP race ID, result status, and source URL.
- Added application safeguards so candidate synchronization does not reactivate a `lost_primary` role.

## Verification

- Primary result records: 43
- Candidate roles with `lost_primary`: 43
- Archived candidates still marked for current-candidate indexing: 0
- Tests: 17 passed
- Production build: passed
- Implementation commit: `9387477`

## Archived candidacies

| Candidate | Party | Office | County | District | Votes | Vote share |
|---|---|---|---|---:|---:|---:|
| Aria DiMezzo | Dem | State House | Cheshire | 3 | 132 | 18.46% |
| C. Blake | Dem | State House | Cheshire | 4 | 38 | 5.79% |
| Michal B. Jakimowicz | Dem | State House | Hillsborough | 15 | 281 | 22.07% |
| Robert Daniel | Dem | State House | Hillsborough | 24 | 258 | 26.52% |
| Derek Verbrugge | Dem | State House | Hillsborough | 25 | 92 | 11.54% |
| Brok Woodward-Griffith | Dem | State House | Hillsborough | 26 | 71 | 6.45% |
| Mark Grigoriev | Dem | State House | Hillsborough | 26 | 73 | 6.64% |
| Rebecca Smith | Dem | State House | Hillsborough | 41 | 1,345 | 20.90% |
| Gabe Holdren | Dem | State House | Merrimack | 12 | 149 | 10.59% |
| Thomas Brennan | Dem | State House | Merrimack | 30 | 1,317 | 48.24% |
| Gale Bailey | Dem | State House | Strafford | 10 | 541 | 7.48% |
| Micah Warnock | Dem | State House | Strafford | 10 | 928 | 12.82% |
| PAUL RASMUSSEN | Dem | State House | Strafford | 10 | 497 | 6.87% |
| John Stone | Dem | State House | Strafford | 12 | 684 | 12.07% |
| Dave DePuy | Dem | State Senate | — | 16 | 1,102 | 20.32% |
| Matthew Ping | Dem | State Senate | — | 20 | 850 | 19.26% |
| Caroline Rockafellow | GOP | State House | Belknap | 2 | 331 | 22.58% |
| Edward Twaddell | GOP | State House | Belknap | 2 | 141 | 9.62% |
| Dana Silcock | GOP | State House | Belknap | 4 | 287 | 42.90% |
| Heather Ingala | GOP | State House | Belknap | 6 | 389 | 8.88% |
| Robert Binda | GOP | State House | Belknap | 6 | 596 | 13.60% |
| George Mottram | GOP | State House | Carroll | 3 | 587 | 26.33% |
| Dallas Emery, Jr | GOP | State House | Carroll | 7 | 609 | 29.00% |
| Jeremy Slottje | GOP | State House | Hillsborough | 13 | 1,010 | 11.97% |
| George D'Orazio | GOP | State House | Hillsborough | 19 | 170 | 24.96% |
| Ralph Boehm | GOP | State House | Hillsborough | 38 | 1,282 | 30.65% |
| Glenn Nielsen | GOP | State House | Merrimack | 2 | 89 | 24.59% |
| Christian Danforth | GOP | State House | Merrimack | 4 | 376 | 24.35% |
| Bruce Gezelman | GOP | State House | Merrimack | 8 | 189 | 13.78% |
| Joshua Shapiro, | GOP | State House | Merrimack | 14 | 154 | 27.90% |
| Mary Deak | GOP | State House | Merrimack | 18 | 51 | 35.17% |
| Nick Hobart | GOP | State House | Rockingham | 1 | 303 | 13.60% |
| Patricia Bridgeo | GOP | State House | Rockingham | 4 | 225 | 7.94% |
| Rani Merryman | GOP | State House | Rockingham | 4 | 239 | 8.44% |
| Emily Phillips | GOP | State House | Rockingham | 7 | 311 | 43.07% |
| Don Selby | GOP | State House | Rockingham | 9 | 200 | 14.72% |
| William Mcgaffigan | GOP | State House | Rockingham | 15 | 259 | 15.25% |
| Bruce Breton | GOP | State House | Rockingham | 17 | 1,020 | 17.81% |
| Matt Sabourin dit Choinière | GOP | State House | Rockingham | 30 | 288 | 23.28% |
| Karen Hanides | GOP | State House | Rockingham | 34 | 687 | 32.70% |
| Sebastian Zyzdorf | GOP | State House | Sullivan | 8 | 556 | 22.79% |
| Anthony Clements | GOP | State Senate | — | 16 | 1,281 | 27.93% |
| Julie Smith | GOP | State Senate | — | 17 | 2,043 | 37.76% |

The machine-readable version is in [primary-loser-archive-2026-09-10.csv](./primary-loser-archive-2026-09-10.csv).

## Races intentionally left pending

The following 12 contested races were not changed because AP had not called the full race at audit time:

- GOP State House, Carroll District 5 — Too Early to Call
- GOP State House, Grafton District 3 — Too Early to Call
- GOP State House, Hillsborough District 1 — Too Early to Call
- GOP State House, Merrimack District 3 — Too Early to Call
- GOP State House, Rockingham District 13 — Too Early to Call
- GOP State House, Rockingham District 16 — Too Early to Call
- GOP State House, Strafford District 1 — Too Early to Call
- Dem State House, Strafford District 6 — Too Early to Call
- GOP State House, Carroll District 8 — Too Early to Call
- GOP State House, Cheshire District 15 — Too Early to Call
- Dem State House, Hillsborough District 40 — Too Early to Call
- GOP State House, Rockingham District 25 — Too Early to Call

