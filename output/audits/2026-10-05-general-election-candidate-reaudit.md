# 2026 General-Election Candidate Reaudit

Audit date: October 5, 2026
Source: New Hampshire Secretary of State candidate list dated September 17, 2026
Scope: State Senator and State Representative candidates compared with production D1

## Coverage

| Office | Source nomination rows | Unique source candidates | Active production roles |
| --- | ---: | ---: | ---: |
| State Senate | 47 | 47 | 47 |
| State Representative | 715 | 711 | 708 |

The four-row difference between House nomination rows and unique candidates is expected. George Randell, Kevin M. Major, Kaley Dvorak, and William F. Fessenden each appear under two party designations in the source list.

## Result

- All 47 State Senate candidates match active production roles.
- No source candidate is missing a person profile or candidate role.
- No active role is absent from the source list.
- No party mismatches remain.
- Robert Jones matched through the Bob Jones alias.
- Katelyn Kuttab matched with Republican Party on her active role.
- Brian Cole's active State House role matched on the consolidated canonical profile.

## Actionable findings

### Restore four Sullivan District 8 roles

The prior audit ended at page 37 and did not include the State Representative entries at the top of page 38. These candidates are present in the source list but their roles are currently archived:

| Candidate | Party | Role ID | Person ID |
| --- | --- | ---: | ---: |
| Hope Damon | Democratic | 607 | 318 |
| Samuel Deering | Democratic | 608 | 912 |
| Catherine Peschke | Republican | 959 | 1187 |
| Jonathan F. Stone | Republican | 250 | 619 |

### Enable the current-candidate flag for 12 matched active roles

Each person below has an active role matching the source list, but `d1_people.is_2026_candidate` is currently `0`:

| Candidate in source | Database profile | District | Role ID | Person ID |
| --- | --- | --- | ---: | ---: |
| Tom Ploszaj | thomas ploszaj | Belknap 1 | 287 | 649 |
| Sly Karasinski | Sylvester Karasinski | Cheshire 10 | 111 | 512 |
| Jim Qualey | Jim Qualey | Cheshire 18 | 740 | 1031 |
| Jeff Kerr | Jeffrey Kerr | Hillsborough 2 | 24 | 437 |
| Matt Drew | Matthew Drew | Hillsborough 19 | 115 | 515 |
| Ted Trost | Theodore Trost | Hillsborough 38 | 201 | 576 |
| Chris Conroy | Christopher Conroy | Hillsborough 44 | 264 | 629 |
| Hal Rafter | Harold Rafter | Rockingham 1 | 206 | 580 |
| JJ DeFeo | John DeFeo | Rockingham 7 | 50 | 463 |
| Jess Edwards | Jesse Edwards | Rockingham 31 | 64 | 476 |
| Ginna Schonwald | Virginia Schonwald | Strafford 4 | 231 | 604 |
| Will Hurley | William Hurley | Strafford 12 | 105 | 508 |

## Intentional exception

Both Daniel Veilleux roles in Hillsborough District 34 remain active, as previously directed. The audit records the second active role as an intentional exception and does not recommend archiving it.

## Recommended correction

Restore the four Sullivan District 8 roles to `active`, then recalculate `is_2026_candidate` from active 2026 roles for the affected people. This will produce 712 active House roles: 711 unique source candidates plus the intentionally retained Daniel Veilleux duplicate.
