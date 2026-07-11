# Architecture

`requirements.pc.json` → `pcRequirementRegistry` → `requirementLedgerService` → `RequirementLedgerPage` / `FinancialWorkbenchPage`。

- Registry：运行时单一清单，派生 route/page，并验证连续性、唯一性、域数和未确认数。
- Service：查询、详情、幂等执行、整数金融原语验证和审计；UNCONFIRMED 在边界拒绝。
- UI：Ant Design 台账、筛选、详情、禁用动作和资金治理语义；不 import `mocks/`。
- 既有资金 services/pages 继续保留，新工作台提供全范围入口与治理视图。

回滚边界是新增 registry/service/pages/routes/menu；删除这些接线即可恢复原后台，不触碰原 Mock 数据结构。

## Registry 层

`pcRequirementRegistry.ts` 使用 TypeScript 的 JSON module 能力读取 workspace 根目录的需求文件。它没有复制 93 条长文本，而是在映射时补充 `route` 与 `page`。数组通过 `Object.freeze` 暴露为只读结构，业务域通过 Set 保持来源首次出现的顺序。`findRequirement` 提供按 ID 的稳定查找；`validateRegistry` 依次检查总数、按索引计算的期望编号、重复 ID、域数和未确认数，并返回所有错误，不在第一处错误后静默停止。

资金页分类是展示路由，不是合同结论。关键词只决定条目应在普通台账还是资金治理视图出现，不改变原始 `group`、`module`、`detail` 或 `unconfirmed`。因此分类错误最多影响入口，不会把未确认条目变成可执行。来源事实始终保留在同一个对象里。

## Service 层

`createRequirementLedgerService` 是可隔离测试的安全合同工厂。`execute` 先验证 requirement 存在与 UNCONFIRMED，再校验金融输入，最后按 requirementId+action+canonical payload hash 检查 replay；同 raw key 不同 scope 明确冲突。页面 singleton 只暴露 query/get/auditTrail，不暴露 execute，避免共享台账冒充领域 mutation。

金额校验要求非负且 `Number.isInteger`，比例除整数外限制在 0..10000。内部字段名显式使用 `amountCent` 与 `rateBp`，避免把元或百分比误传进 service。返回审计副本时也复制 input，调用方不能通过修改返回对象篡改内部记录。

## UI 与路由层

`App.tsx` 在认证布局内接入四类路径：台账根路径、业务域路径、需求详情路径和资金工作台路径。React Router 会优先匹配更具体的 domain 路径。AdminLayout 从 registry 派生 17 个域菜单，避免手工菜单与需求源不一致；现有菜单、路由和页面保持原样。

RequirementLedgerPage 的 effect 只调用 `requirementLedgerService`。表格列、筛选器、详情抽屉与按钮状态都基于 service 返回的 PcRequirement，不读取 `mocks/data.ts`。FinancialWorkbenchPage 同样先经 service 查询，再对 `page === financial` 的结果做视图过滤。两页都没有持久化、网络或环境凭证依赖。

## 边界与演进

如果未来接真实后端，应保留 service 接口并替换工厂内部 repository，而不是让页面直接 fetch。持久化审计需要后端唯一约束保证幂等，当前内存 Map 不能作为分布式保证。资金关键词可改为来源中显式分类字段，但迁移前需对 93 条结果做差异测试。动态 import 可以降低 Ant Design 初始 chunk，但属于性能演进，不与本次正确性修改混合。
