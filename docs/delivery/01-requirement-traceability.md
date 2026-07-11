# Requirement Traceability

- 范围：PC-080..PC-172，连续唯一 93 条。
- 业务域：17 个；UNCONFIRMED：24 条，状态为 `UNCONFIRMED_ACTION_DISABLED`。
- 机器可读明细：`docs/delivery/requirements-traceability.json`。
- 每条均含 `id/source/AC/owner/route/page/service/mock/test/verifier/status/evidenceHash`，locator 使用实际存在的 `path#L行号` 或 `path#symbol`。
- 来源行定位由 `experiment/requirements.pc.json` 实际文本计算；运行时完整性由 `validateRegistry` 与单元测试验证。

## 字段语义

`id` 是需求主键；`source` 指向唯一功能需求源的实际行；`AC` 用一句可验证结果描述当前实现；`owner` 按普通运营或财务运营归属；`route` 指向 React Router 接线；`page` 指向通用台账或资金工作台组件；`service` 与 `mock` 分别指出页面边界和本地实现；`test` 指向对应合同测试；`verifier` 指向运行时完整性校验；`status` 区分已实现和动作禁用；`evidenceHash` 原样携带来源 SHA-256。

普通条目的 AC 是“按域查询、查看详情、Mock 执行并保留审计”。资金条目的 AC 进一步要求工作台呈现幂等、状态、审计、异常和对账语义。UNCONFIRMED 条目的 AC 不承诺执行结果，只承诺保留来源口径并在 UI 与 service 双层禁用真实动作。这种差异不是推断新需求，而是把共同合同中的硬规则映射到每一行。

## 生成与验证方法

追踪生成时逐行扫描 `requirements.pc.json`，找到每个 `"id": "PC-nnn"` 的真实行号，因此 `source` 不是笼统文件名。页面类型使用与 registry 相同的资金关键词判定。生成后用 Node 重新解析 JSON：数组长度 93、Set 唯一数 93、首尾编号正确、状态为 `UNCONFIRMED_ACTION_DISABLED` 的数量 24、每行 12 字段齐全。随后把七个 locator 字段按 `#` 拆分并检查路径存在，结果 broken locator 为 0。

`path#symbol` 表示稳定的导出组件或函数，例如 `App`、`RequirementLedgerPage`、`createRequirementLedgerService` 和 `validateRegistry`。测试定位使用 `path#L5`，来源使用逐条计算的 `path#L行号`。当前验证只证明路径与锚点形式存在；若未来重命名 symbol 或移动代码，必须重新生成追踪，不能只手改文档状态。

## 变更纪律

需求 ID 不能复用或重新排序。新增范围应使用新的来源版本并更新预期首尾、数量和哈希；删除条目应先由产品合同确认，不能通过过滤 registry 隐藏。UNCONFIRMED 转为已确认时，需要同时更新来源 JSON、具体执行规则、测试、状态和证据哈希。只修改 `status` 而不修改来源与验证器不构成确认。
