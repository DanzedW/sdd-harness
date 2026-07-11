# Spec: PC-080..PC-172 17-domain administration

## ADDED Requirements

### Requirement: Source and implementation truth
The system SHALL use V1.4 PC-080..PC-172 as the only functional scope and SHALL keep current implementation evidence distinct from planned domain boundaries.

#### Scenario: Scope integrity
**Given** the V1.4 JSON and module implementation matrix
**When** the contract validator computes ID unions
**Then** it finds 93 consecutive unique IDs, 17 real domains and 24 UNCONFIRMED IDs with no missing or duplicate ownership.

### Requirement: Content operations domain
#### Scenario: Publish content safely
**Given** PC-080/081 news and notice records
**When** content operators edit, preview, publish, disable or reorder them
**Then** a content service validates state/order and emits audit evidence beyond the shared ledger.

### Requirement: User management domain
#### Scenario: Scoped and masked user operation
**Given** PC-082..085 user populations and PC-083 dependencies
**When** operators query details or change status/risk
**Then** identifiers remain masked, population scope is explicit, changes are audited and unconfirmed dependent actions stay blocked.

### Requirement: Invoice lottery domain
#### Scenario: Entire domain blocked pending contract
**Given** PC-086..092 are UNCONFIRMED
**When** verification, lottery, pool or reward mutation is requested
**Then** the service rejects it while preserving dependency, result and failure placeholders.

### Requirement: Category information domain
#### Scenario: Maintain hierarchy and association
**Given** PC-093/094 categories and optional sellable associations
**When** operators edit hierarchy, order, state or content association
**Then** cycles and invalid parents are rejected and information-only records remain distinguishable.

### Requirement: Merchant management domain
#### Scenario: Integrate merchant lifecycle
**Given** PC-095..103 onboarding, merchant, staff, store, QR, split and speaker requirements
**When** merchant operators review or configure the lifecycle
**Then** existing specialized pages/services are integrated, split safety is enforced and PC-103 device actions remain blocked.

### Requirement: Commerce management domain
#### Scenario: Preserve order, payment and fulfillment facts
**Given** PC-104..112 product/order lifecycle records
**When** product, inventory, fulfillment or after-sale state changes
**Then** price snapshots, independent payment facts, integer cents, audit and exception reasons remain traceable and PC-112 is not invented.

### Requirement: Point management domain
#### Scenario: Funded point lifecycle
**Given** PC-113..120 grant, claim, record, pool, source, expiry and consumption rules
**When** points are granted, occupied, released, used or settled
**Then** idempotency, masking, conservation, audit and reconciliation hold while PC-116/120 policies remain blocked.

### Requirement: Coupon management domain
#### Scenario: Coupon lifecycle and responsibility
**Given** PC-121..135 template, campaign, claim, lock, verify, refund, pool and scope facts
**When** operators configure or process coupons
**Then** version, responsibility, lock/release, settlement and audit facts are preserved while PC-121/132 dependencies remain blocked.

### Requirement: Point benefit domain
#### Scenario: Sign-in and benefit reward
**Given** PC-136..138 sign-in and benefit records
**When** rules or rewards are processed
**Then** rules are versioned, rewards are idempotent and PC-138 fulfillment stays blocked until confirmed.

### Requirement: Event registration domain
#### Scenario: Capacity and verification
**Given** PC-139/140 event windows, capacity and rosters
**When** registration or verification occurs
**Then** closed/over-capacity/duplicate actions are rejected and successful verification is idempotently audited.

### Requirement: Utility payment domain
#### Scenario: Read-only unconfirmed workbench
**Given** PC-141..146 are all UNCONFIRMED
**When** operators view provider, bill, payment, result or configuration facts
**Then** the workbench is read-only, real mutation is rejected and finance/refund/reconciliation dependencies remain explicit.

### Requirement: Mini-program management domain
#### Scenario: Secret-safe PC configuration
**Given** PC-147 configuration metadata
**When** administrators query or change public configuration state
**Then** credentials are never rendered or persisted and each state change is audited.

### Requirement: Focus image domain
#### Scenario: Placement and schedule integrity
**Given** PC-148/149 content and placement records
**When** operators schedule, order, preview or publish them
**Then** placement/schedule conflicts are rejected and publish evidence is retained.

### Requirement: Protocol and FAQ domain
#### Scenario: Versioned safe content
**Given** PC-150..154 protocols and FAQ content
**When** content owners version, preview or publish them
**Then** audience/effective intervals are retained, rich text is sanitized and historical versions are not rewritten.

### Requirement: Finance management domain
#### Scenario: Specialized finance boundaries
**Given** PC-155..162 payment, business order and withdrawal requirements
**When** finance users query or execute payment/refund/split/settlement/reconciliation actions
**Then** payment and business-order facts map to specialized evidence with integer primitives, idempotency, state, audit, reversal and reconciliation; PC-158..160 utility-order dependencies stay blocked and PC-161..162 withdrawal remains shared.

### Requirement: System management domain
#### Scenario: Least-privilege governance
**Given** PC-163..168 parameters, roles, permissions, menus, administrators and logs
**When** system administrators mutate governance configuration
**Then** RBAC and least privilege are enforced, parameters are versioned and operation logs remain immutable.

### Requirement: Home-service management domain
#### Scenario: V1.4 home-service lifecycle
**Given** PC-169..172 service, order, fulfillment and after-sale requirements
**When** home-service operators process the lifecycle
**Then** state/exception facts are audited and refund uses the finance-safe boundary regardless of the old reference's deferred statement.

### Requirement: Financial safety
#### Scenario: Reject invalid or duplicate finance mutation
**Given** an L-level action with cents, basis points and idempotency scope
**When** input is fractional/out of bounds or the request repeats
**Then** invalid input is rejected before mutation and an allowed duplicate returns the original single-audit result.

#### Scenario: Preserve partial success
**Given** multi-item refund, split, settlement or reconciliation
**When** only some items succeed
**Then** success and failure items, exception reasons and resolving reconciliation are preserved; overall success is forbidden.

### Requirement: UNCONFIRMED and exception boundary
#### Scenario: Block then migrate explicitly
**Given** an UNCONFIRMED requirement or unavailable dependency
**When** UI/service mutation is attempted or a later confirmation arrives
**Then** current mutation is blocked; confirmation requires source/hash, rule, migration task and test updates before UI enablement.

### Requirement: Evidence migration
#### Scenario: Do not overclaim shared locators
**Given** first-wave shared route/page/service/test locators
**When** a domain milestone has not passed
**Then** its trace remains first-wave, PLANNED or BLOCKED; only verified domain artifacts may replace shared locators.
