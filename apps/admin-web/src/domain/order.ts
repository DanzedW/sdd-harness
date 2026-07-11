// 订单领域 — Order + 状态机

import type { BaseRecord } from "./base";

// ============================================================
// 订单状态机（12 状态）
// ============================================================
export enum OrderStatus {
  PENDING_PAYMENT = 0,
  PENDING_DELIVERY = 1,
  PENDING_VERIFY = 2,
  PENDING_SERVICE = 3,
  SHIPPED = 4,
  IN_SERVICE = 5,
  COMPLETED = 6,
  REFUNDING = 7,
  REFUNDED = 8,
  REFUND_FAILED = 9,
  CLOSED = 10,
  PARTIAL_REFUND = 11,
}

export type TransactionScene = "ONLINE" | "OFFLINE" | "UNCONFIRMED";
export type PaymentState = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "TIMEOUT" | "MANUAL" | "UNCONFIRMED";
export type FulfillmentState =
  | "NOT_REQUIRED"
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "UNCONFIRMED";
export type SettlementEligibilityState =
  | "WAITING_PAYMENT"
  | "WAITING_FULFILLMENT"
  | "ELIGIBLE"
  | "BLOCKED";
export type OrderSplitState = "NOT_CREATED" | "PENDING" | "PROCESSING" | "PARTIAL" | "SUCCESS" | "FAILED" | "REVERSED";
export type MerchantPayoutState = "NOT_DUE" | "SCHEDULED" | "PROCESSING" | "PAID" | "FAILED" | "UNCONFIRMED";
export type OrderReconciliationState = "NOT_STARTED" | "MATCHED" | "MISMATCH" | "RESOLVING" | "RESOLVED";

export const OrderStatusLabel: Record<OrderStatus, string> = {
  [OrderStatus.PENDING_PAYMENT]: "待支付",
  [OrderStatus.PENDING_DELIVERY]: "待发货",
  [OrderStatus.PENDING_VERIFY]: "待核销",
  [OrderStatus.PENDING_SERVICE]: "待服务",
  [OrderStatus.SHIPPED]: "已发货",
  [OrderStatus.IN_SERVICE]: "服务中",
  [OrderStatus.COMPLETED]: "已完成",
  [OrderStatus.REFUNDING]: "退款中",
  [OrderStatus.REFUNDED]: "已退款",
  [OrderStatus.REFUND_FAILED]: "退款失败",
  [OrderStatus.CLOSED]: "已关闭",
  [OrderStatus.PARTIAL_REFUND]: "部分退款",
};

export const OrderStatusColor: Record<OrderStatus, string> = {
  [OrderStatus.PENDING_PAYMENT]: "orange",
  [OrderStatus.PENDING_DELIVERY]: "blue",
  [OrderStatus.PENDING_VERIFY]: "purple",
  [OrderStatus.PENDING_SERVICE]: "cyan",
  [OrderStatus.SHIPPED]: "geekblue",
  [OrderStatus.IN_SERVICE]: "processing",
  [OrderStatus.COMPLETED]: "green",
  [OrderStatus.REFUNDING]: "warning",
  [OrderStatus.REFUNDED]: "default",
  [OrderStatus.REFUND_FAILED]: "red",
  [OrderStatus.CLOSED]: "default",
  [OrderStatus.PARTIAL_REFUND]: "volcano",
};

export const OrderTypeLabel: Record<number, string> = {
  0: "实物邮寄",
  1: "到店核销",
  2: "上门服务",
  3: "虚拟权益",
};

// ============================================================
// Order（订单）— 核心聚合根
// ============================================================
export interface Order extends BaseRecord {
  orderNo: string;
  orderType: number;
  orderSource: number;
  userId: string;
  userName: string;
  merchantId: string;
  merchantName: string;
  shopId: string;
  productName: string;
  quantity: number;
  // 金额（单位：分）
  totalAmount: number;
  freightAmount: number;
  discountAmount: number;
  payAmount: number;
  coinAmount: number;
  coinCount: number;
  commissionAmount: number;
  settleAmount: number;
  // 商品快照
  spuId: string;
  skuId: string;
  productSnapshot: string;
  // 收货信息
  consigneeName: string;
  consigneePhone: string;
  consigneeAddr: string;
  trackingCompany: string;
  trackingNo: string;
  // 服务信息
  serviceTime: string;
  serviceAddr: string;
  verifyCode: string;
  verifiedAt: string;
  // 支付信息
  paymentMethod: number;
  paymentChannel: number;
  paymentId: string;
  paidAt: string;
  // 状态
  orderStatus: OrderStatus;
  // 时间戳
  createdAt: string;
  shippedAt: string;
  receivedAt: string;
  completedAt: string;
  closedAt: string;
  // 退款
  refundStatus: number;
  refundAmount: number;
  refundedAt: string;
  // 其他
  cancelReason: string;
  cancelOperator: string;
  remark: string;
  transactionScene: TransactionScene;
  paymentState: PaymentState;
  fulfillmentState: FulfillmentState;
  settlementEligibilityState: SettlementEligibilityState;
  splitState: OrderSplitState;
  merchantPayoutState: MerchantPayoutState;
  reconciliationState: OrderReconciliationState;
  profileSnapshotId: string | null;
  idempotentKey: string;
}
