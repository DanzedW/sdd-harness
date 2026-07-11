# Acceptance Criteria: 17-domain implementation contract

## AC-D01 内容运营（PC-080..081）
GIVEN 新闻和公告有查询、发布状态、展示顺序与审计事实
WHEN 内容运营创建、编辑、预览、发布、停用或调整顺序
THEN 专用 content service 校验状态与顺序并追加审计，shared ledger 只提供入口而不代替 CRUD 证据。

## AC-D02 用户管理（PC-082..085）
GIVEN 用户范围区分 C 端、商户人员与后台管理员且标识需脱敏
WHEN 用户运营查询详情或修改启用、禁用和风险状态
THEN 页面只经 user service 返回脱敏资料与相关事实，状态变更有审计，PC-083 依赖动作保持禁用。

## AC-D03 发票抽奖（PC-086..092）
GIVEN 七项规则全部为 UNCONFIRMED
WHEN 运营查看发票、验真、本地/重复判断、抽奖、奖池或奖励记录
THEN 系统保留依赖、失败与来源说明，所有真实验真/抽奖/奖励 mutation 禁用且 service 拒绝执行。

## AC-D04 分类信息（PC-093..094）
GIVEN 分类存在层级、顺序、状态及可选售卖对象关联
WHEN 运营维护分类或分类内容
THEN category service 防止非法层级/环，保存审计，并明确区分信息展示与可售卖关联。

## AC-D05 商家管理（PC-095..103）
GIVEN 商户生命周期跨入驻、档案、人员、标签、门店、收款码、分账配置与云喇叭
WHEN 商户运营审核、维护或配置
THEN 复用现有 merchant/shop/QR/settlement 专页，分账遵守渠道与资金安全，PC-103 设备动作保持禁用。

## AC-D06 电商管理（PC-104..112）
GIVEN 商品、SKU、分类、运费、订单、履约和售后是一个可追踪生命周期
WHEN 商品或订单状态变化、发货或退款
THEN commerce service 保留价格/订单/支付/履约事实和异常，金额使用整数分，PC-112 未确认边界不自动执行。

## AC-D07 积分管理（PC-113..120）
GIVEN 积分包含发放、记录、消费、资金池、来源、有效期、消耗顺序和不足记账
WHEN 运营发放、认领、占用、释放、使用或结算积分
THEN point services 保证幂等、资金守恒、脱敏认领、审计和对账，PC-116/120 政策未确认时阻断相关动作。

## AC-D08 票券管理（PC-121..135）
GIVEN 票券生命周期覆盖模板、活动、领取、锁定、核销、退款、资金池和使用范围
WHEN 运营配置或处理票券
THEN coupon services 记录版本、责任主体、占用/释放/结算与审计，PC-121/132 依赖动作保持禁用。

## AC-D09 积分权益（PC-136..138）
GIVEN 签到配置、记录与权益包需要独立业务语义
WHEN 运营配置签到或查看/发放权益
THEN benefit service 版本化规则、幂等奖励并保留记录，PC-138 依赖未确认时不履约。

## AC-D10 活动报名（PC-139..140）
GIVEN 活动有时间、容量、状态、报名名单和核销状态
WHEN 运营维护活动或核销报名
THEN event service 拒绝关闭/超容量/重复核销，成功动作幂等且有审计，`/campaigns` 不再用 placeholder 冒充完成。

## AC-D11 生活缴费管理（PC-141..146）
GIVEN 水费、充电、停车及三类接口/停车配置六项全部 UNCONFIRMED
WHEN 运营查看配置、账单、支付、结果或异常
THEN 页面为只读依赖视图，所有真实缴费/配置 mutation 禁用，service 保留 provider、金额、失败、退款和对账合同占位。

## AC-D12 小程序管理（PC-147）
GIVEN PC 后台只管理小程序配置而不实现客户端
WHEN 管理员查询、启用或停用配置
THEN config service 校验公开标识、隐藏凭证并审计状态，不把任何 secret 写入 Mock、日志或页面。

## AC-D13 焦点图（PC-148..149）
GIVEN 焦点图包含内容、位置、排期、顺序和状态
WHEN 投放运营编辑、预览、发布或调整位置
THEN focus image service 校验排期/位置冲突并审计，AdvertisementPage 获得 PC-148/149 语义测试。

## AC-D14 平台协议与常见问题（PC-150..154）
GIVEN 协议和 FAQ 具有版本、受众、生效区间、分类、顺序和发布状态
WHEN 法务内容或客服知识负责人维护内容
THEN platform content service 保存不可回写版本、净化预览并审计发布，不把 ContractPage 单一入口当成五项全覆盖。

## AC-D15 财务管理（PC-155..162）
GIVEN 支付、业务订单、退款、分账、结算、对账与提现事实必须分离且可审计
WHEN 财务执行或重试任何资金动作
THEN 绑定现有专用 page/service/test，使用整数分/基点、幂等、状态机、异常、冲正和对账，PC-158..160 提现规则未确认时禁用。

## AC-D16 系统管理（PC-163..168）
GIVEN 全局参数、角色、权限、菜单、管理员和操作日志受最小权限约束
WHEN 系统管理员修改配置或查询日志
THEN system service 版本化参数、校验 RBAC、审计管理动作且操作日志不可编辑。

## AC-D17 到家服务管理（PC-169..172）
GIVEN V1.4 明确包含服务项目、订单、履约和售后退款
WHEN 到家运营创建服务、处理订单、更新履约或售后
THEN home-service service 保留状态与异常，退款经过 finance-safe 边界；不得沿用旧参考“暂缓上门服务”排除当前 PC 范围。

## AC-F01 资金原语与幂等
GIVEN 任一 L 级资金动作包含金额、比例和幂等范围
WHEN service 接收负数/小数分、非整数/越界基点或重复请求
THEN 非法输入在 mutation 前拒绝，同范围重复请求返回原结果且只产生一条审计。

## AC-F02 部分成功、冲正与对账
GIVEN 分账、退款、结算或权益资金操作可出现部分成功
WHEN 任一分项失败或渠道事实与业务账不一致
THEN 系统保留成功/失败分项、异常原因和 resolving reconciliation，禁止把整体标为成功，并只按允许状态重试/冲正。

## AC-U01 UNCONFIRMED 迁移
GIVEN 24 条来源标记 `unconfirmed=true`
WHEN 用户查看、调用 service 或后续收到正式确认
THEN 当前显示依赖/风险/禁用动作并双层阻断；确认后必须先更新来源/hash、规则、migration task 和 tests，最后才开放 UI。

## AC-E01 依赖失败与非法状态
GIVEN 第三方/Mock 依赖不可用、实体不存在或状态转换非法
WHEN 领域 service 处理请求
THEN 返回可分类错误并保留原始事实，不直接改成成功、不吞掉失败、不产生重复审计。

## AC-E02 Evidence closure
GIVEN 当前 trace 共享 1 route、2 pages、1 service 和 2 tests
WHEN M1..M6 逐域完成
THEN 只把通过领域测试与里程碑的条目迁移到真实 owner/page/service/test locator，未完成项保持 first-wave/PLANNED/BLOCKED。
