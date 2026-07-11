# Tasks and verifiable milestones

## M0 — First-wave foundation (complete)

- [x] M0.1 建立 93/17/24 registry 与完整性测试。_Boundary:_ 只读 V1.4 JSON。
- [x] M0.2 建立共享台账、共享 service 和 UNCONFIRMED 双层禁用。_Boundary:_ 不声明领域语义完成。
- [x] M0.3 建立资金 overview、93 行 trace、test/typecheck/build 证据。
- Verify: `pnpm --filter admin-web test --run && pnpm typecheck && pnpm build`。

## M1 — Domain contract registry (COMPLETE)

- [x] M1.1 新增 `domainCatalog.ts`，映射 17 个真实域、owner、命名 route、page/service/test 状态。
- [x] M1.2 RED→GREEN 测试：17 域、93 ID union、24 UNCONFIRMED、无数字域路由、无 planned locator。
- [x] M1.3 由 catalog 迁移 93 行 trace，未确认项保持禁用，共享项不伪装成专用实现。
- Verify: targeted registry tests + JSON self-check + `pnpm typecheck`。

## M2 — Domain semantic services and pages (PARTIAL)

- [ ] M2.1 内容/用户/分类/焦点图/协议域：复用现有页面并补语义 services/tests。
- [ ] M2.2 商家/电商/系统域：整合现有页面，补 lifecycle/RBAC/audit tests。
- [ ] M2.3 积分权益/活动报名/小程序/到家域：新增缺失专页和 service，不再使用 placeholder 作为完成证据。
- [ ] M2.4 每域至少一个 unit、一个 integration 或 route contract、一个 UI/manual evidence locator。
- Verify: per-domain test list from module matrix + `pnpm typecheck`。

## M3 — Financial safety gate (PARTIAL: specialized mapping complete)

- [x] M3.1 将积分/券资金池、积分发放认领绑定现有专用 page/service/test；发票抽奖保持 blocked。
- [x] M3.2 将支付/退款/分账/结算/对账绑定现有专用证据；PC-161..162 提现保持 shared 直到专页落盘。
- [x] M3.3 生活缴费六项保持 read-only/blocked，直到 provider、计费、退款和资金主体确认。
- [ ] M3.4 写部分成功、重复回调、重试/冲正、资金不足、非法比例和 reconciliation difference 测试。
- Verify: finance suites + no floating financial fields scan + `pnpm typecheck`。

## M4 — Cross-domain lifecycle and exceptions

- [ ] M4.1 商户→门店→商品→订单→支付/权益→履约→售后→结算/对账集成 fixture。
- [ ] M4.2 对依赖不可用、状态越迁、重复动作、部分成功、未确认规则建立统一错误分类。
- [ ] M4.3 确保异常只追加事实与审计，不直接覆写为成功。
- Verify: integration tests with before/after facts and reconciliation assertions。

## M5 — UI and manual evidence (PARTIAL: source contract complete, browser pending)

- [x] M5.1 App/AdminLayout 使用 17 个命名路由，页面显示 owner、成熟度、主证据与专用入口；source-contract test 通过。
- [x] M5.2 24 条 UNCONFIRMED 在共享 UI disabled，绕过 UI 时 service 仍拒绝。
- [ ] M5.3 采集关键 interaction state transitions、console errors、viewport 与 manual checklist。
- Verify: UI tests + Browser/Playwright probe report `pass=true`。

## M6 — Evidence closure (COMPLETE for this code wave)

- [x] M6.1 将 93 行 trace 的 owner/route/page/service/mock/test/verifier/status 更新到真实存在 locator。
- [x] M6.2 route 存真实 URL、routeLocator 存代码锚点；status 5 specialized / 64 shared / 24 disabled；无 planned/broken locator。
- [x] M6.3 final full test 12 files/49 tests、typecheck、build 通过，并运行 93/17/24 与 locator 自检。
- Verify: `pnpm --filter admin-web test --run && pnpm typecheck && pnpm build` + evidence audit。
