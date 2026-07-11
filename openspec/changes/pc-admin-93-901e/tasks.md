# Tasks and verifiable milestones

## M0 — First-wave foundation (complete)

- [x] M0.1 建立 93/17/24 registry 与完整性测试。_Boundary:_ 只读 V1.4 JSON。
- [x] M0.2 建立共享台账、共享 service 和 UNCONFIRMED 双层禁用。_Boundary:_ 不声明领域语义完成。
- [x] M0.3 建立资金 overview、93 行 trace、test/typecheck/build 证据。
- Verify: `pnpm --filter admin-web test --run && pnpm typecheck && pnpm build`。

## M1 — Domain contract registry (next code wave)

- [ ] M1.1 新增 domainImplementationRegistry，映射 17 个真实域、owner、route、page/service/test 状态。
- [ ] M1.2 写失败测试：17 域、93 ID union、24 UNCONFIRMED、无默认 owner/domain-N、无重复路由所有权。
- [ ] M1.3 提供 trace migration helper，但不修改未实现领域为 VERIFIED。
- Verify: targeted registry tests + JSON self-check + `pnpm typecheck`。

## M2 — Domain semantic services and pages

- [ ] M2.1 内容/用户/分类/焦点图/协议域：复用现有页面并补语义 services/tests。
- [ ] M2.2 商家/电商/系统域：整合现有页面，补 lifecycle/RBAC/audit tests。
- [ ] M2.3 积分权益/活动报名/小程序/到家域：新增缺失专页和 service，不再使用 placeholder 作为完成证据。
- [ ] M2.4 每域至少一个 unit、一个 integration 或 route contract、一个 UI/manual evidence locator。
- Verify: per-domain test list from module matrix + `pnpm typecheck`。

## M3 — Financial safety gate

- [ ] M3.1 发票抽奖奖励、积分/券资金池与发放认领：实现整数、责任、幂等、审计、异常和对账合同。
- [ ] M3.2 财务域：把支付/退款/分账/结算/对账需求绑定现有专用 page/service/test；提现保持 blocked 直到确认。
- [ ] M3.3 生活缴费六项保持 read-only/blocked，直到 provider、计费、退款和资金主体确认。
- [ ] M3.4 写部分成功、重复回调、重试/冲正、资金不足、非法比例和 reconciliation difference 测试。
- Verify: finance suites + no floating financial fields scan + `pnpm typecheck`。

## M4 — Cross-domain lifecycle and exceptions

- [ ] M4.1 商户→门店→商品→订单→支付/权益→履约→售后→结算/对账集成 fixture。
- [ ] M4.2 对依赖不可用、状态越迁、重复动作、部分成功、未确认规则建立统一错误分类。
- [ ] M4.3 确保异常只追加事实与审计，不直接覆写为成功。
- Verify: integration tests with before/after facts and reconciliation assertions。

## M5 — UI and manual evidence

- [ ] M5.1 17 域路由可达、选中态正确、空态/错误态可见。
- [ ] M5.2 24 条 UNCONFIRMED 在专页和共享页均 disabled，绕过 UI 时 service 仍拒绝。
- [ ] M5.3 采集关键 interaction state transitions、console errors、viewport 与 manual checklist。
- Verify: UI tests + Browser/Playwright probe report `pass=true`。

## M6 — Evidence closure

- [ ] M6.1 将 93 行 trace 的 owner/route/page/service/mock/test/verifier/status 更新到真实领域 locator。
- [ ] M6.2 输出唯一分布与共享 locator 解释；PLANNED/BLOCKED 不得标 IMPLEMENTED。
- [ ] M6.3 运行 full test/typecheck/build、matrix/trace JSON 自检、Markdown placeholder/link scan。
- Verify: `pnpm --filter admin-web test --run && pnpm typecheck && pnpm build` + evidence audit。
