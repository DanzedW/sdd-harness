# Proposal: 17-domain PC admin implementation contract

## User

- 平台运营按 17 个真实业务域管理内容、用户、商户、交易、权益、渠道与系统配置。
- 财务、结算与对账人员需要在支付、退款、分账、资金池、结算、提现和对账上获得专用状态、异常与审计证据。
- 评审者需要从 V1.4 物理行追到 owner、route、page strategy、service、mock、AC、test、milestone 和证据。

## Problem

第一波实现已经建立 93/17/24 registry、共享台账、共享 service、资金治理汇总和逐行 trace，但它把 93 条 route 合并到 `App#App`，把 36 条普通能力映射到一个台账页，把 57 条资金关键词能力映射到一个工作台，并把所有条目映射到一个 service。这个结构证明“范围可见、未确认动作可阻断”，不能证明 17 个领域语义已经实现。

2026-07 旧文档提供跨端闭环与资金状态参考，但混合三端/H5/后台/真实渠道，保留 75 项待重算报价，缺少 V1.4 物理行、17 域 owner、逐条 AC/locator、UNCONFIRMED 动作迁移、测试矩阵与可验证里程碑。它是批判超越对象，不是本 change 的需求源。

## Scope

- 唯一功能范围仍为 `experiment/requirements.pc.json` 的 PC-080..PC-172，共 93 条、17 域、24 条 UNCONFIRMED。
- 用 `docs/delivery/module-implementation-matrix.json` 定义每域真实名称、ID、owner、route、页面策略、现有页面、service、mock、AC、test、里程碑、未确认 ID 与资金安全。
- OpenSpec 为每个域声明 Given/When/Then，并为资金安全、异常边界、共享基础升级和 evidence closure 声明跨域门禁。
- 下一代码波次按 M1..M6 推进；通用台账只承载同构查询/详情/简单配置，不替代领域 service 和语义测试。

## Non-goals

- 本轮不修改 `apps/admin-web`，不宣称 planned page/service/test 已实现。
- 不复制旧文档的 75 项报价，不扩大到 C/B 小程序、H5、真实支付渠道或非 PC 端。
- 不自动执行 24 条 UNCONFIRMED，不为第三方接口、设备、合同、提现或资金责任编造默认规则。
- 不把共享 locator 重命名为领域 locator 来制造覆盖；只有真实专页/service/test 落盘后才更新 trace 状态。

## Metrics

- 模块矩阵恰有 17 个唯一真实域，ID union 恰为 PC-080..PC-172，重复/遗漏为 0，UNCONFIRMED union 为 24。
- 17 域均有 owner、route、pageStrategy、existingPages、services、mocks、ACs、tests、milestones 和 financeSafety。
- OpenSpec 至少有 17 个领域 GWT、资金安全 GWT、异常/边界 GWT、File Structure Plan、依赖关系和逐里程碑验证命令。
- LLMWiki 矩阵 17 域逐行映射 unit/integration/UI/manual evidence，并明确 existing/planned/blocked。
- 当前 trace 的 owner/route/page/service/test/status 唯一分布被公开解释；共享 locator 只作为第一波基础证据。
