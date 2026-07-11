# Findings

## 术语
### **功能台账**
由需求 registry 生成的可查询、可追踪运营页面。

### **UNCONFIRMED**
尚未确认的接口或合同口径，相关真实动作一律禁用。

### **整数分**
资金金额的唯一内部单位，禁止浮点金额。

### **整数基点**
比例的唯一内部单位，取值 0..10000。
- 功能台账: 由需求 registry 生成的可查询、可追踪运营页面。
- UNCONFIRMED: 尚未确认的接口或合同口径，相关真实动作一律禁用。
- 整数分: 资金金额的唯一内部单位，禁止浮点金额。
- 整数基点: 比例的唯一内部单位，取值 0..10000。
- 功能台账：由 `requirements.pc.json` 的 93 条记录生成的可查询运营页面，每条保留需求 ID、域、模块、路由、状态和证据。
- UNCONFIRMED：外部接口、设备、合同或资金口径尚未确认；允许查看说明，但真实执行按钮必须禁用，不推断业务结论。
- 金额/比例：金额在领域与 Mock 中统一用整数分（cent），比例统一用整数基点（bp，0..10000）。
- 专用资金工作台：支付、退款、分账、结算、对账等高风险流程采用专门页面和 service，具备幂等、状态、审计、异常与对账语义。

## 边界
- 范围仅为 PC-080..PC-172，连续唯一共 93 条，分属 17 个业务域，其中 24 条为 UNCONFIRMED。
- non-goal：不实现真实后端、第三方接口、移动端或 B2B 页面；所有页面仅通过 services 访问 Mock。
- non-goal：不建设通用低代码框架，不修改原业务项目、公共 evaluator、controller 或另一实验 workspace。
- 保留既有有效 React/TypeScript/Ant Design/React Router 页面，以配置驱动台账补齐全范围并接入 17 域导航。
- 推荐方案已授权：无需追加澄清；以可运行功能、验证命令、逐条追踪和核心文档为优先级。

## brief 路由决策
- brief-route: `experiment/requirements.pc.json` -> product/spec；Excel 只作为 immutable evidence。
- `brief = experiment/requirements.pc.json`：它是唯一功能需求源；Excel 仅作不可变来源证据，不从其他目录补充业务判断。

## ADR 候选
- ADR-001：以强类型 registry 作为 93 条需求的单一运行时清单，UI、导航、service 路由和追踪文件从相同 ID/域映射校验。
- ADR-002：通用低风险条目复用 FeatureLedgerPage；资金类复用 FinancialWorkbench；现有专用页面继续保留，避免空壳占位。

## 2026-07 gap audit findings

- 旧文档 `three-terminal-mvp-business-process.md` 只作为批判超越对象；其三端/H5/真实渠道/75项报价不得进入 V1.4 PC scope。
- 旧文档第 5 节暂缓上门服务、第 7 节排除发票，与当前 V1.4 PC-169..172 和 PC-086..092 冲突；以 V1.4 为准，发票动作因来源标记保持 blocked。
- 当前第一波 trace 的 owner/route/page/service/test 唯一分布过度共享，只证明 93 条可见和 24 条阻断，不证明 17 域语义。
- ADR-003：新增 17 域 module implementation matrix，严格区分 existing 与 `planned:`，作为下一波 owner/page/service/test 迁移合同。
- ADR-004：trace 采用逐域里程碑迁移；未通过领域测试的条目不得从 first-wave/PLANNED/BLOCKED 改为 IMPLEMENTED。
