# NHLA 2026 candidate endorsement reconciliation

- Source: https://www.nhliberty.org/2026-candidate-endorsements/
- Explanation page: https://nhdeservesbetter.com/free-staters
- Reconciled and applied: 2026-10-11
- Production database: `nhdb`
- Profile-consolidation bookmark: `00007ac0-0000000c-00005101-3c9681cf58b88adab266695ce8630c60`
- Endorsement-update bookmark: `00007ac0-00000016-00005101-8aa4845c49974ac29119d30afd43e0fd`

## Result

- Candidates on the current NHLA page: 143
- Matched person profiles: 143
- Profiles labeled `Free State Aligned`: 143
- Published, source-linked NHLA position records: 143
- Duplicate profile pairs consolidated: 12
- Legacy profile URLs preserved as aliases: 12
- Orphaned candidate roles after consolidation: 0
- Orphaned campaign contributions after consolidation: 0

Candidate search status was preserved independently from endorsement status.
There are 140 listed candidates with active 2026 roles. Catherine Peschke,
Jonathan Stone, and Susan DeLemus remain archived under the pre-existing
election-status records, but their profiles and NHLA alignment labels remain
available.

Dallas Emery's Carroll 7 special-primary result remains historical. A separate
active Carroll 5 general-election write-in role was added based on the current
NHLA listing and the candidate's campaign site.

## Files

- `audit.csv`: source-to-profile reconciliation for all 143 candidates
- `apply.sql`: idempotent endorsement and alignment update
- `verify.sql`: exact post-import verification query
- `../../migrations/0038_reconcile_nhla_2026_general_endorsements.sql`: profile
  consolidation, Dallas Emery role preservation, and endorsement update
