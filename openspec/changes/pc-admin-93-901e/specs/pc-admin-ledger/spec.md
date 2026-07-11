# PC Admin Ledger Specification

## ADDED Requirements

### Requirement: Complete registry
The system SHALL represent every ID PC-080 through PC-172 exactly once and group them into the 17 source business domains.

### Requirement: Safe execution
The system SHALL disable and reject mutation for every requirement marked UNCONFIRMED while retaining its source wording.

### Requirement: Service boundary
The UI SHALL access Mock data only through services. Financial values SHALL be integer cents and rates SHALL be integer basis points.

### Requirement: Financial semantics
Payment, refund, split, settlement and reconciliation views SHALL expose idempotency, state, audit, exception and reconciliation information.
