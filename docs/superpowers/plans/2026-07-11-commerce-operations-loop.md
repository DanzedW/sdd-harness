# Commerce Operations Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 B/4D 中交付可操作、可持久化、可审计的商户到结算电商运营闭环。

**Architecture:** 新增一个领域状态机与本地持久化服务，由单一运营工作台消费；现有商户、商品、订单、退款和结算页面继续作为专业页面。需求追踪保留为辅助入口，不参与业务状态所有权。

**Tech Stack:** React 19、TypeScript、Ant Design、Vitest、React Router、localStorage Mock repository

## Global Constraints

- 只修改 B/4D；A/master 保持冻结。
- 金额只使用整数分，状态变化必须写审计。
- 未确认的外部能力不得模拟为真实支付或真实清结算。
- 不新增依赖、Harness、事件总线或后端服务。
- 每个行为先 RED、再 GREEN、最后重构。

---

### Task 1: 业务状态机与持久化服务

**Files:**
- Create: `apps/admin-web/src/domain/commerceWorkflow.ts`
- Create: `apps/admin-web/src/services/commerceWorkflowService.ts`
- Test: `apps/admin-web/src/services/commerceWorkflowService.test.ts`

**Interfaces:**
- Produces: `CommerceCase`, `CommerceStage`, `CommerceAction`, `CommerceAuditEntry`
- Produces: `commerceWorkflowService.list()`, `get(id)`, `act(id, action, operator, idempotencyKey)`, `reset()`
- Produces: `getAvailableActions(caseItem)` and `getNextAction(caseItem)`

- [ ] **Step 1: Write failing lifecycle tests**

Test the exact chain `MERCHANT_REVIEW → PRODUCT_PUBLISH → PAYMENT → FULFILLMENT → SETTLEMENT → COMPLETED`, rejection of skipped actions, integer-cent validation, audit before/after states, localStorage persistence, reset, refund, reconciliation, and idempotent replay.

- [ ] **Step 2: Run RED**

Run: `pnpm --filter admin-web test -- commerceWorkflowService.test.ts --run`

Expected: FAIL because the domain and service modules do not exist.

- [ ] **Step 3: Implement minimal state machine**

Use an explicit transition map rather than condition chains. Store `{ cases, idempotencyResults }` under `digital-life:commerce-workflow:v1`. Every action clones state before mutation and appends one immutable audit entry.

- [ ] **Step 4: Run GREEN and full tests**

Run: `pnpm --filter admin-web test -- commerceWorkflowService.test.ts --run`

Expected: all new lifecycle tests pass.

Run: `pnpm --filter admin-web test -- --run`

Expected: all existing and new tests pass.

- [ ] **Step 5: Commit**

Commit: `feat(admin): add auditable commerce workflow state machine`

### Task 2: 电商运营工作台

**Files:**
- Create: `apps/admin-web/src/pages/CommerceWorkbenchPage.tsx`
- Create: `apps/admin-web/src/pages/commerceWorkbenchModel.ts`
- Test: `apps/admin-web/src/pages/commerceWorkbenchModel.test.ts`
- Modify: `apps/admin-web/src/App.tsx`

**Interfaces:**
- Consumes: Task 1 service and domain types.
- Produces: route `/commerce-workbench`.
- Produces: `buildCommerceSummary(cases)` and `buildCommerceTimeline(caseItem)`.

- [ ] **Step 1: Write failing presentation-model tests**

Verify stage counts, risk counts, next-action text, six timeline entries, completed/refunded terminal display and money formatting.

- [ ] **Step 2: Run RED**

Run: `pnpm --filter admin-web test -- commerceWorkbenchModel.test.ts --run`

Expected: FAIL because the model module does not exist.

- [ ] **Step 3: Implement model and page**

Build a responsive page with summary cards, searchable case table, detail drawer, six-step timeline, guarded primary action, refund/reconciliation actions, audit table, reset confirmation and links to existing professional pages.

- [ ] **Step 4: Run GREEN**

Run: `pnpm --filter admin-web test -- commerceWorkbenchModel.test.ts --run`

Expected: model tests pass.

- [ ] **Step 5: Commit**

Commit: `feat(admin): add commerce operations workbench`

### Task 3: 产品导航与经营首页

**Files:**
- Modify: `apps/admin-web/src/layouts/AdminLayout.tsx`
- Modify: `apps/admin-web/src/pages/DashboardPage.tsx`
- Create: `apps/admin-web/src/pages/dashboardModel.ts`
- Test: `apps/admin-web/src/pages/dashboardModel.test.ts`

**Interfaces:**
- Consumes: Task 1 service summary.
- Produces: primary menu entry “电商运营工作台”.
- Produces: secondary menu group “需求与交付证据” containing the 93-row registry.

- [ ] **Step 1: Write failing dashboard-model test**

Verify pending-case, risk-case and completed-case counts are derived from workflow cases rather than hard-coded text.

- [ ] **Step 2: Run RED**

Run: `pnpm --filter admin-web test -- dashboardModel.test.ts --run`

Expected: FAIL because the dashboard model does not exist.

- [ ] **Step 3: Implement product cleanup**

Remove “AI 工作流监督” from the user-facing dashboard. Add commerce pending/risk/completed metrics and quick links. Move the 17-domain requirement registry beneath a secondary evidence menu label.

- [ ] **Step 4: Run GREEN and static gates**

Run: `pnpm --filter admin-web test -- --run`

Run: `pnpm typecheck`

Run: `pnpm build`

Expected: tests, typecheck and build exit 0.

- [ ] **Step 5: Commit**

Commit: `feat(admin): make business operations the primary experience`

### Task 4: 浏览器验收与交付说明

**Files:**
- Modify: `docs/delivery/README.md`
- Create: `docs/delivery/commerce-operations-acceptance.md`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: repeatable local acceptance instructions and honest Mock boundaries.

- [ ] **Step 1: Run fresh full gates**

Run tests, typecheck and build from Task 3 again after documentation reconciliation.

- [ ] **Step 2: Run browser flow**

Log in, open `/commerce-workbench`, advance one case by at least two legal actions, verify audit growth, refresh and verify persistence, reset data, then inspect existing professional-page links.

- [ ] **Step 3: Write acceptance evidence**

Record exact commands, results, workflow states observed, local URL, limitations and rollback commit.

- [ ] **Step 4: Commit**

Commit: `docs: deliver commerce operations acceptance evidence`
