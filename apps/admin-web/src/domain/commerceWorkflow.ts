export type CommerceStage =
  | "MERCHANT_REVIEW"
  | "PRODUCT_PUBLISH"
  | "PAYMENT"
  | "FULFILLMENT"
  | "SETTLEMENT"
  | "RECONCILIATION"
  | "REFUNDING"
  | "REFUNDED"
  | "COMPLETED";

export type CommerceAction =
  | "APPROVE_MERCHANT"
  | "PUBLISH_PRODUCT"
  | "CONFIRM_PAYMENT"
  | "CONFIRM_FULFILLMENT"
  | "COMPLETE_SETTLEMENT"
  | "REQUEST_REFUND"
  | "COMPLETE_REFUND"
  | "FLAG_RECONCILIATION"
  | "RESOLVE_RECONCILIATION";

export interface CommerceAuditEntry {
  id: string;
  action: CommerceAction;
  operator: string;
  fromStage: CommerceStage;
  toStage: CommerceStage;
  note: string;
  createdAt: string;
}

export interface CommerceCase {
  id: string;
  merchantName: string;
  productName: string;
  orderNo: string;
  orderAmount: number;
  stage: CommerceStage;
  riskMessage: string;
  updatedAt: string;
  audits: CommerceAuditEntry[];
}

export interface CreateCommerceCaseInput {
  merchantName: string;
  productName: string;
  orderAmount: number;
}

export const COMMERCE_STAGE_LABELS: Record<CommerceStage, string> = {
  MERCHANT_REVIEW: "待商户审核",
  PRODUCT_PUBLISH: "待商品上架",
  PAYMENT: "待支付",
  FULFILLMENT: "待履约",
  SETTLEMENT: "待结算",
  RECONCILIATION: "待对账",
  REFUNDING: "退款处理中",
  REFUNDED: "已退款",
  COMPLETED: "已完成",
};

export const COMMERCE_ACTION_LABELS: Record<CommerceAction, string> = {
  APPROVE_MERCHANT: "通过商户审核",
  PUBLISH_PRODUCT: "上架商品",
  CONFIRM_PAYMENT: "确认支付",
  CONFIRM_FULFILLMENT: "确认履约并生成结算单",
  COMPLETE_SETTLEMENT: "完成结算",
  REQUEST_REFUND: "申请退款",
  COMPLETE_REFUND: "确认退款到账",
  FLAG_RECONCILIATION: "标记对账差异",
  RESOLVE_RECONCILIATION: "解决对账差异",
};
