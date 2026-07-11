# Acceptance Criteria

## AC-1
GIVEN `requirements.pc.json` 含 PC-080..PC-172
WHEN registry 被加载
THEN 恰有 93 个连续唯一 ID，覆盖 17 个业务域。

## AC-2
GIVEN 24 条需求标记 `unconfirmed=true`
WHEN 用户打开台账或尝试执行真实动作
THEN 明示 UNCONFIRMED 且动作禁用，service 拒绝执行。

## AC-3
GIVEN 页面需要 Mock 数据
WHEN 页面查询、查看详情或更新状态
THEN 页面只调用 service，金额为整数分、比例为整数基点，并保留审计记录。

## AC-4
GIVEN 支付退款分账结算对账功能
WHEN 用户进入资金域
THEN 呈现专用工作台的幂等键、状态、异常、审计和对账语义，而非空壳占位。

## AC-5
GIVEN 实现完成
WHEN 运行 test、typecheck、build 和追踪验证
THEN 命令成功且 93 条 locator 指向实际文件行或 symbol。
