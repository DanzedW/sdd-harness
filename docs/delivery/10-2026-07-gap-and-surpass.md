# 2026-07 基准缺口与本版超越合同

## 定位与证据边界

本文件比较 `evaluation/reference/three-terminal-mvp-business-process.md`（下称“旧文档”）与当前 V1.4 PC 后台交付。旧文档是批判超越对象，不是功能需求源。当前唯一功能范围仍是 `experiment/requirements.pc.json` 的 PC-080..PC-172；每条保留 `excelRow`、`sourceSha256` 和原始 `unconfirmed`。旧文档中的三端、到店 H5、真实支付渠道、75 项报价和跨端 MVP 描述不会写入 registry，也不会扩大本轮 PC 范围。

旧文档并非无价值。其第 2 节“订单与支付分离”、第 6 节状态关系、第 8 节商务前提为资金安全提供了可参考的问题清单；但参考规则只有在 V1.4 对应条目、当前代码与测试共同支持时才进入实施合同。没有来源绑定的内容只作为设计风险，不作为已确认 AC。

## 缺口 1：范围叙事混层

旧文档第 1 节在同一表格中并列 C 端小程序、B 端小程序、到店收款 H5、平台运营后台和“后台核心能力”；随后又描述真实渠道、云喇叭和多端闭环。第 7 节继续把 C/B/H5/后台放在同一 MVP 包含范围。这种写法适合目标产品总览，但不能回答当前 PC Mock 到底交付了什么。

本版超越策略：proposal 的 Scope/Non-goals 只接受 V1.4 93 行；模块矩阵恰好 17 个 PC 业务域；每域列出真实 ID、owner、route 和页面策略。`小程序管理`仅指 PC-147 的后台配置，不意味着本轮实现小程序客户端。`生活缴费管理`仅定义 PC 后台的只读/禁用合同，不声称完成第三方缴费。验证脚本对矩阵 ID union 做 93/17/24 检查，任何跨端条目都无法进入 union。

## 缺口 2：75 项旧报价和当前 93 条口径冲突

旧文档第 9 节明确保留 2026-07-01 的 75 项、1,003,000 元历史报价，并标注“待重算”。它还使用 C/B/后台三端计数，无法作为当前 93 条 PC 验收口径。报价档位与支付服务商实施边界也不是本次代码完成度证明。

本版超越策略：不复制金额，不把价格当里程碑；完成定义使用 PC-080..172、17 域、24 UNCONFIRMED、领域 AC、真实 page/service/test locator 与 test/typecheck/build。`module-implementation-matrix.json` 的 `requirementIds` 是可重算数组，不依赖旧功能数。报价需要另行商务重算，不能通过本 change 的 IMPLEMENTED 状态推导。

## 缺口 3：来源不可重算

旧文档给出业务过程和历史报价，但没有为每项能力保留 V1.4 Excel 物理行、source SHA、版本差异或逐条变更记录。因此无法判断某条规则来自当前 Excel、历史会话还是设计推演。例如第 5 节将上门服务暂缓，而当前 V1.4 明确存在 PC-169..172 到家服务四条；第 7 节又把发票列为明确不包含，而当前 V1.4 有 PC-086..092 发票抽奖七条。

本版超越策略：`requirements-traceability.json` 的 93 行 source 定位到 `requirements.pc.json#L行号`，evidenceHash 原样使用来源 SHA。模块矩阵显式把到家服务列为第 17 域，并在 pageStrategy 说明旧文档“暂缓”不能覆盖 V1.4；发票七条全部纳入，但因来源标记 UNCONFIRMED 而保持动作禁用。范围冲突通过“V1.4 优先、旧文档仅参考”解决，不做折中猜测。

## 缺口 4：缺 requirement 到证据闭环

旧文档没有 requirement → AC → owner → route → page → service → mock → test → verifier → status → evidence 的逐条链。第 6 节状态表描述了订单、支付、权益、履约、分账、结算和对账，但没有指向当前磁盘的 `PaymentPage`、`splitService.test.ts` 或任何可执行验证命令。

第一版当前证据已经做到 93 行与 12 字段，但分布暴露出真实局限：owner 只有“平台运营”36 条与“财务运营”57 条；route 93 条全部指向 `App#App`；page 只有 RequirementLedgerPage 36 条和 FinancialWorkbenchPage 57 条；service 93 条都指向 requirementLedgerService；test 只有 registry test 69 条与 ledger service test 24 条；status 为 IMPLEMENTED 69 与 UNCONFIRMED_ACTION_DISABLED 24。这些共享 locator 合理证明范围、入口与禁用保护，却不能证明领域语义。

本版超越策略：模块矩阵为 17 域提供下一层真实 owner、现有专页、planned service/mock/test 和里程碑。OpenSpec M6 要求只有通过领域里程碑后才迁移 trace；未完成项保持 first-wave、PLANNED 或 BLOCKED。共享 locator 的重复分布被公开解释，而非通过改名制造唯一性。

## 缺口 5：平台后台模块边界和 owner 不足

旧文档第 1 节把平台后台职责概括为商户/商品/订单/权益、交易、异常、结算协议、分账、结算、对账及角色权限；粒度仍不足以派发 17 域开发。它没有说明焦点图归谁、协议/FAQ 谁负责、到家售后如何接退款、生活缴费在未确认时采用什么页面策略。

本版超越策略：矩阵中的每域 owner 使用可读角色，例如“内容运营负责人”“用户运营与风控负责人”“财务结算与对账负责人”，不使用编号化匿名域名。`pageStrategy` 区分复用现有页面、扩展现有页面、替换 placeholder、新增专页和只读禁用工作台。`existingPages/services/mocks` 只列当前磁盘存在项；未来项统一加 `planned:`，避免把设计当实现。

商家、电商、积分、票券和财务域优先整合当前已有的 MerchantPage、ProductPage、OrderPage、PointGrantPage、FundingPoolPage、CouponPage、PaymentPage、RefundPage、SplitInstructionPage、SettlementPage、ReconciliationPage 等。内容、发票抽奖、生活缴费、积分权益、活动、FAQ 和到家服务等缺专页域明确进入下一代码波次。

## 缺口 6：UNCONFIRMED 只有集中列表，没有逐域执行合同

旧文档第 8 节集中列出券资金责任、积分预算、现金主体、费率、退款、部分成功、自动收货、H5 登录、播报设备、支付尝试、缴费接口、权限矩阵和工作日等前提。问题是这些前提没有绑定具体 PC ID、owner、route、依赖、禁用动作、测试或确认后的迁移顺序。

本版超越策略：矩阵每域都有 `unconfirmedIds` 与 `financeSafety.gaps`。24 条分布到用户 1、发票 7、商家 1、电商 1、积分 2、票券 2、积分权益 1、生活缴费 6、财务 3，其余域为 0。每个相关 AC 明确“查看什么、禁用什么、service 如何拒绝”。AC-U01 规定确认迁移必须依次更新来源/hash、正式规则、migration task、tests 和 UI；不能只翻转按钮或把 status 统一写成 VERIFIED。

当前代码已有共享 UI disabled 与 service 拒绝，这是第一道真实证据；下一波仍需在发票、生活缴费、提现、设备、资金池等专用 service 重复落实并写领域测试。矩阵把它们标成 planned/blocked，不声称已经完成。

## 缺口 7：没有交付证据和 Doc-vs-Code

旧文档没有真实命令输出、测试矩阵、代码 locator、changed files、rollback、Doc-vs-Code 或构建风险。其状态表和流程描述无法证明当前仓库能运行。

本版已有第一波证据：fresh Vitest 11 files/41 tests、typecheck exit 0、build exit 0、93/24 trace 自检、changed files、rollback 和 time ledger。与此同时 verify probe 因缺 Browser/Playwright viewport 与 state transition 为 `pass:false`；文档没有把 unit/build 冒充 E2E。

下一波证据策略：LLMWiki test matrix 对 17 域逐行区分 existing、planned、blocked；M5 要求 route/UI/manual evidence 和真实 Browser probe；M6 要求更新 93 行领域 locator、输出唯一分布、跑 full test/typecheck/build 与 Doc-vs-Code audit。通用 registry 测试只能证明 union，不计为每域语义测试。

## 缺口 8：验收粒度和里程碑不足

旧文档第 3、4 节有较清楚的线上/到店步骤，第 6 节也有状态表，但没有 Given/When/Then、异常边界测试、可验证 milestone 或逐阶段命令。尤其“部分成功不得伪装为整体成功”没有绑定具体 test；“异常保留原始事实”也没有 error taxonomy 与 evidence closure。

本版超越策略：acceptance criteria 和 spec 均包含 17 域 GWT；另有资金原语/幂等、部分成功/冲正/对账、UNCONFIRMED 迁移、依赖失败/非法状态和 evidence closure 场景。design 定义 M0..M6：共享基础、领域 registry、普通域 services/pages、L 级资金安全、跨域 lifecycle、UI/manual evidence、trace closure。tasks 为每个 milestone 给出复选项和验证命令。

## 当前第一版缺口与下一代码波次

当前两个新增页面与单一 requirementLedgerService 是必要但不足的第一版。RequirementLedgerPage 解决 93 条可见、筛选、详情和共享禁用；FinancialWorkbenchPage 解决资金治理语义总览；单 service 解决查询、最小幂等审计、整数 guard 与 UNCONFIRMED 拒绝。它们不能替代新闻发布、用户风险、发票验真、分类关联、商户生命周期、商品履约、积分/券责任、活动核销、缴费接口、协议版本、RBAC、到家售后等领域行为。

下一代码波次按 M1..M6：先建立 domain implementation registry 和失败测试；再复用/扩展现有专页并新增缺失域 service/page；随后完成 L 级资金安全与跨域异常；再采集 17 域 UI/manual/browser evidence；最后迁移 trace。任何 planned 文件名都是实施意图，不是当前磁盘 locator。

Target-T 代码波次已完成其中的 catalog/route/evidence 层：17 个命名 slug 与 route、领域 owner/成熟度/主证据展示、九项现有资金专用能力入口、93 行领域化 trace 和 4 个 catalog/trace/UI-boundary tests 已落盘。当前缺口收敛为 M2/M4 的领域语义 service 与跨域 lifecycle，以及 M5 的真实 Browser/manual evidence；planned 文件仍不进入 locator。

## 自检口径

- matrix domains = 17；名称与 V1.4 group 唯一集合完全相等。
- requirement ID union = 93，首尾 PC-080/PC-172，duplicate/missing = 0。
- unconfirmed union = 24，与来源标记集合完全相等。
- 每域必含 owner、route、pageStrategy、existingPages、services、mocks、ACs、tests、milestones、unconfirmedIds、financeSafety。
- OpenSpec domain GWT = 17，且另有资金安全、异常边界和 evidence migration。
- test matrix = 17 域，每行同时有 unit、integration、UI、manual evidence，并区分 existing/planned/blocked。
