# Documentation vs Code

| 声明 | 代码/证据 |
|---|---|
| 93 条、17 域、24 未确认 | `pcRequirementRegistry.ts#validateRegistry` + registry test |
| 页面只经 service 访问 Mock | `RequirementLedgerPage.tsx`、`FinancialWorkbenchPage.tsx` 仅 import service |
| 未确认动作禁用 | 共享台账与 shared factory/singleton 都无 execute/mutation API |
| 整数分/基点 | `assertFinancialInput` + service test |
| 资金治理语义 | `FinancialWorkbenchPage` 的幂等/状态/审计/异常/对账说明 |
| 逐条追踪 | `requirements-traceability.json` 93 个对象、12 个字段 |

文档没有宣称真实后端、持久化审计、第三方集成或已确认的 UNCONFIRMED 规则。

## 对照方法

文档中的“93 条”可由三处相互校验：需求 JSON 的数组长度、`PC_REQUIREMENTS` 测试和追踪 JSON 数量。三者首尾均为 PC-080/PC-172，唯一数为 93。文档中的“17 域”来自 registry Set，不是菜单里手写的数字；AdminLayout 直接 map 同一个 `PC_REQUIREMENT_GROUPS`，因此域入口不会因重复维护而漏项。

文档中的“24 条禁用”对应来源 `unconfirmed=true` 与追踪 status。共享 UI 只展示来源事实，shared service 只 query/get/auditTrail；测试断言 factory/singleton 均不存在 execute。

“页面只经 services 访问 Mock”通过 import 边界核对。两个新增页面只 import registry 类型/域常量和 `requirementLedgerService`；没有 import `mocks/data`。registry import 的是 immutable functional requirements，不是可变业务 Mock。service 当前以 registry 作为本地读模型，执行与审计也在 service 内，页面不直接改数组。

“资金专用工作台”对应实际 `FinancialWorkbenchPage`，不是路由占位。页面查询 service、过滤资金分类、计算统计卡、呈现治理 Descriptions 和资金需求 Table。它明确区分可 Mock 执行与等待确认，并在 App 与 AdminLayout 都有入口。已有专用资金页面未删除，符合“保留已有有效页面并重构整合”。

## 数值与证据口径

文档只引用最终 fresh 输出：11 files/41 tests、3166 modules、各 chunk 大小和 exit 0。定向 RED/GREEN 使用同一测试命令和两个文件。首次 typecheck 失败被保留在返工记录，不能因为最终通过而删除。verify probe 是 pass false，原因是缺浏览器事实；任何“全部 4D gate 通过”的表述都与磁盘不一致。

追踪 locator 的路径已程序检查为 0 broken，但 `#symbol` 的语义仍依赖导出名稳定。代码重命名后应同时更新 JSON 并重跑验证。来源 `#L` 会随 requirements 文件插入行而变化，来源版本更新时必须再计算，不能沿用旧行号。

## 审阅清单

审阅者应逐项确认：App 有四类新路由；AdminLayout 有 17 域派生菜单；registry 没有变造来源字段；service 的保护发生在审计创建前；测试使用新 service 实例避免状态泄漏；页面没有直接 import Mock；资金工作台不是空壳；交付文档没有 secrets；追踪有 93 行与 12 字段；风险中明确浏览器和包体缺口。

## Target-T 当前分布

typed `domainCatalog.ts` 提供 17 个 owner 与实际 URL route；代码锚点另存 `routeLocator`。最终真实性修复后 status 为 `IMPLEMENTED_SPECIALIZED=5`、`IMPLEMENTED_SHARED=64`、`UNCONFIRMED_ACTION_DISABLED=24`，只把真实 page→facade→tested underlying chain 标为 specialized。

共享 locator 仍有合理复用：RequirementLedgerPage 承载 26 条跨域 inventory，requirementLedgerService 承载 31 条共享/阻断能力；这不再是单 locator，也不表示这些条目拥有专用语义。支付、退款、分账、结算、对账、积分/券资金池、积分发放和认领通过 `FINANCE_SPECIALIZED_CAPABILITIES` 映射现有专页、service、mock 与 test；FinancialWorkbench 只展示聚合入口和证据。
