# Risks, Rollback and UNCONFIRMED

## Risks

- 构建提示 Ant Design chunk 1,244.55 kB（gzip 392.85 kB）；不影响正确性，后续可按页面动态 import。
- 本次未运行真实浏览器视觉/交互 E2E；UI 合同由 TypeScript、route wiring 和 unit tests 覆盖。
- Mock 审计在内存中，刷新后清空；真实持久化明确不在范围。

## UNCONFIRMED

24 条来源标记原样保留。共享台账和 shared service 都是只读，没有 generic mutation API；真实动作只能由未来专用领域能力在确认后实现。

## Rollback

回退本交付 commit；或移除 App 的 `/operations`、`/financial-workbench` 路由和 AdminLayout 的 `pc-ledger` 菜单，不影响既有页面与 Mock。

## 风险分级

高风险是把未确认口径误当成可执行规则。本实现删除 shared factory/singleton 的全部 execute 代码，UI 只查询、详情与导航。未来专用 service 仍必须把 `unconfirmed` 保护列为金融和外部接口变更的必查项。

shared service 的 auditTrail 当前是只读空模型，不代表持久化审计。真实领域接入仍必须使用后端事务、幂等约束和审计存储；不得把 overview 文案当成渠道成功凭证。

中风险还包括没有浏览器 E2E。TypeScript 能证明 props 与路由编译，但不能证明表格在特定 viewport 下无溢出、菜单滚动正常或抽屉关闭后的历史行为完全符合预期。`probe-report.json` 明确为 false，而非使用 waiver 生成假通过。补证时至少覆盖登录、17 域菜单、关键词筛选、UNCONFIRMED 禁用、确认条目执行提示和资金工作台入口。

低到中风险是初始包体。Ant Design chunk 压缩前约 1.24 MB，Vite 发出警告。当前后台已有大量 Ant Design 页面，该问题不是新增两页单独造成；后续可对大页面做 route-level lazy import，并用相同 build 输出比较 gzip 变化。不能仅提高 warning limit 作为优化完成证据。

## UNCONFIRMED 处理细则

来源中 24 条标记覆盖发票核验与抽奖规则、第三方系统或设备、部分资金口径等。registry 不解析长文本来猜结果，只消费明确的 `unconfirmed` 字段。列表保留完整 detail；shared factory 与 singleton 都只有 query/get/auditTrail。

确认流程必须从需求源开始：产品或商务提供可追溯结论，更新 JSON 标记和详细规则；开发实现具体状态机或接口；测试覆盖成功、失败、幂等和回滚；追踪更新 AC、owner、test、status 与 evidenceHash；最后再开放 UI。任何只通过浏览器开发者工具移除 disabled 的做法都会被 service 拦截。

## 分层回滚

如果只发现菜单拥挤，可先回滚 AdminLayout 中 `pc-ledger` 项，保留直达路由用于内部验证。如果发现页面交互问题，可移除四个 App route 与两个 page import，registry、service 和测试仍可留作后续修复。如果发现 registry 来源接入问题，应同时移除 registry/service/pages/tests，避免残留无法访问的代码。完整回滚使用 Git revert 本次 commit，禁止 reset 或覆盖用户其他变更。

回滚后需重新运行全量测试、typecheck 和 build，并检查现有首页、商户、商品、订单、结算与系统页面仍可编译。若回滚原因涉及资金语义，还要重跑既有 split、fundingPool、settlementRules、pointGrant 和 v03MockServices 测试，不能只看新增测试消失。
