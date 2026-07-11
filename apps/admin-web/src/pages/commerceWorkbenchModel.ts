import {
  COMMERCE_ACTION_LABELS,
  type CommerceCase,
  type CommerceStage,
} from "../domain/commerceWorkflow";
import { getNextAction } from "../services/commerceWorkflowService";

export interface CommerceSummary {
  total: number;
  pending: number;
  risk: number;
  completed: number;
  refunded: number;
}

export type TimelineStatus = "wait" | "process" | "finish" | "error";

const MAIN_STAGES: Array<{ stage: CommerceStage; title: string }> = [
  { stage: "MERCHANT_REVIEW", title: "商户审核" },
  { stage: "PRODUCT_PUBLISH", title: "商品上架" },
  { stage: "PAYMENT", title: "订单支付" },
  { stage: "FULFILLMENT", title: "履约确认" },
  { stage: "SETTLEMENT", title: "结算处理" },
  { stage: "COMPLETED", title: "业务完成" },
];

export function buildCommerceSummary(cases: CommerceCase[]): CommerceSummary {
  return cases.reduce(
    (summary, item) => {
      summary.total += 1;
      summary.risk += item.riskMessage ? 1 : 0;
      summary.completed += item.stage === "COMPLETED" ? 1 : 0;
      summary.refunded += item.stage === "REFUNDED" ? 1 : 0;
      summary.pending += item.stage !== "COMPLETED" && item.stage !== "REFUNDED" ? 1 : 0;
      return summary;
    },
    { total: 0, pending: 0, risk: 0, completed: 0, refunded: 0 },
  );
}

export function buildCommerceTimeline(caseItem: CommerceCase) {
  const currentIndex = caseItem.stage === "REFUNDED"
    ? 2
    : caseItem.stage === "REFUNDING"
      ? 2
      : caseItem.stage === "RECONCILIATION"
        ? 4
        : MAIN_STAGES.findIndex((item) => item.stage === caseItem.stage);
  return MAIN_STAGES.map((item, index) => ({
    title: item.title,
    status: (caseItem.stage === "REFUNDED" && index === currentIndex
      ? "error"
      : index < currentIndex
        ? "finish"
        : index === currentIndex
          ? "process"
          : "wait") as TimelineStatus,
  }));
}

export function getPrimaryActionText(caseItem: CommerceCase) {
  if (caseItem.stage === "COMPLETED") return "流程已完成";
  if (caseItem.stage === "REFUNDED") return "退款已完成";
  const action = getNextAction(caseItem);
  return action ? COMMERCE_ACTION_LABELS[action] : "等待人工处理";
}

export function formatCommerceMoney(cents: number) {
  return `¥${(cents / 100).toFixed(2)}`;
}
