const FINANCE_TERMS = /资金|金额|支付|退款|分账|结算|对账|提现|订单|积分|票券|消费券|奖池/;

export function getWorkbenchKind(input: { group: string; detail: string }): "finance" | "registry" {
  return input.group === "财务管理" || FINANCE_TERMS.test(input.detail) ? "finance" : "registry";
}
