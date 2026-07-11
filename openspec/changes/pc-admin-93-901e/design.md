# Design: 17-domain contract and next-wave boundaries

## Architecture decision

采用三层合同：V1.4 JSON 是唯一 requirement truth；`module-implementation-matrix.json` 是 17 域实施边界与现状/计划 truth；OpenSpec 是可执行验收与里程碑 truth。2026-07 参考只用于 gap 分析，不进入 registry 或范围 union。

第一波共享基础继续存在：`pcRequirementRegistry` 保证 93/17/24，`requirementLedgerService` 提供查询、详情、UNCONFIRMED 阻断和最小审计，两个共享页面提供全范围入口。第二波不得继续把共享 service 当成领域实现；每域按矩阵复用已有专页或新增专页，并增加领域 service、mock fixture 与语义测试。

## File Structure Plan

### Current first-wave files

- `apps/admin-web/src/registry/pcRequirementRegistry.ts`：范围完整性与共享 route/page 分类；保留。
- `apps/admin-web/src/services/requirementLedgerService.ts`：共享查询/禁用保护；保留但不扩成 17 域上帝 service。
- `apps/admin-web/src/pages/RequirementLedgerPage.tsx`：跨域台账入口；保留为 inventory view。
- `apps/admin-web/src/pages/FinancialWorkbenchPage.tsx`：资金治理汇总；保留为 overview，不替代专页。

### Next code-wave files (planned, not present yet)

- `apps/admin-web/src/registry/domainImplementationRegistry.ts`：从实施矩阵派生领域 owner、route、策略与 evidence 状态。
- `apps/admin-web/src/services/contentOperationsService.ts`、`userOperationsService.ts`、`invoiceLotteryService.ts`、`categoryContentService.ts`、`merchantOperationsService.ts`、`commerceLifecycleService.ts`。
- `apps/admin-web/src/services/pointDomainService.ts`、`couponLifecycleService.ts`、`pointBenefitService.ts`、`eventRegistrationService.ts`、`utilityPaymentService.ts`。
- `apps/admin-web/src/services/miniProgramConfigService.ts`、`focusImageService.ts`、`platformContentService.ts`、`financeOperationsService.ts`、`systemGovernanceService.ts`、`homeServiceOperationsService.ts`。
- `apps/admin-web/src/pages/domains/`：只为没有合适现有专页的域新增页面；商家、电商、积分、票券、财务优先整合现有专页。
- `apps/admin-web/src/mocks/domain/`：按域拆分可审计 fixture；页面仍不得直接 import。
- `apps/admin-web/src/**/*.test.ts(x)`：领域 unit/integration/UI 合同测试；共享 registry 测试不能替代它们。

## Module dependencies

```text
requirements.pc.json
  -> pcRequirementRegistry (scope integrity)
  -> domainImplementationRegistry (owner/strategy/evidence)
  -> domain services (semantic rules and guards)
  -> existing or dedicated pages
  -> route/UI/manual evidence

financial domain services
  -> integer cents/basis points
  -> idempotency + state machine + audit
  -> exception/retry/reversal
  -> reconciliation linkage
```

_Boundary:_ UI 只能调用 service；Mock 只能被 service/repository 读取；V1.4 source 字段不可由 UI 覆盖。

_Boundary:_ 普通同构 CRUD 可复用共享表格，但发票奖励、积分/券资金池、支付、退款、分账、结算、对账、提现与到家售后必须有专用领域边界。

_Boundary:_ `unconfirmed=true` 的 mutation 在 UI、service、测试三层显式为 blocked；确认后通过来源变更、迁移任务和回归门禁开放。

## Error and edge handling

- Missing/duplicate ID：registry 初始化失败，禁止渲染“部分成功”台账。
- Invalid domain mapping：矩阵自检报告 missing/duplicate union，不能用默认 owner 或 `domain-N` 占位。
- Service dependency unavailable：返回可区分的 dependency-blocked 状态，保留原始失败，不直接改业务状态。
- Invalid financial primitive：小数/负数金额、非整数/越界基点在进入 mutation 前拒绝。
- Duplicate callback/action：同一幂等范围返回原结果；跨需求/跨动作不得错误复用。
- Partial finance success：保留成功分项和失败分项，进入 resolving reconciliation，禁止整体显示成功。
- UNCONFIRMED：显示依赖、风险、禁用动作和确认迁移，不用统一“已验证”状态。

## Milestones and verification

| Milestone | Deliverable | Verification |
|---|---|---|
| M0 complete | 93/17/24 registry、共享台账/service、资金 overview、trace | `pnpm --filter admin-web test --run`；matrix/trace JSON self-check |
| M1 | domainImplementationRegistry + 17 域 owner/route/evidence contract | registry unit tests；17/93/24 union script |
| M2 | 普通 CRUD 域 services/pages：内容、用户、分类、商家、电商、权益、活动、渠道、焦点图、协议、系统、到家基础 | 每域 service tests + route/UI contract；`pnpm typecheck` |
| M3 | L 级资金安全：发票奖励、积分/券资金池、支付、退款、分账、结算、对账、提现/缴费 guard | finance unit/integration tests；integer/idempotency/state/audit/reversal/reconciliation assertions |
| M4 | 跨域 lifecycle：商户→商品→订单→权益→资金→售后→对账 | integration fixtures；异常与部分成功用例 |
| M5 | 17 域 UI/manual evidence | route tests、disabled-action UI tests、逐域手工证据；Browser probe |
| M6 | trace/evidence closure | 93 row locators 更新为真实领域 page/service/test；test/typecheck/build；Doc-vs-Code audit |

## Trace migration rule

当前分布是 owner 2 类、route 1 个、page 2 个、service 1 个、test 2 个、status 2 个。这是共享基础的真实现状。下一波每完成一个域，才把该域条目的 page/service/test/owner locator 从 shared 更新为专用值；milestone 未通过的条目保持 first-wave 或 PLANNED/BLOCKED，不得批量改成 VERIFIED。
