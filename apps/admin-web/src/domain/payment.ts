// 支付领域 — Payment + 支付状态机

import type { BaseRecord, Cents } from "./base";

// ============================================================
// 支付状态机
// ============================================================
export enum PaymentStatus {
  PENDING = "待支付",
  PROCESSING = "支付中",
  SUCCESS = "支付成功",
  FAILED = "支付失败",
  TIMEOUT = "支付超时",
  MANUAL = "人工处理",
}

export const PaymentStatusColor: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: "default",
  [PaymentStatus.PROCESSING]: "processing",
  [PaymentStatus.SUCCESS]: "green",
  [PaymentStatus.FAILED]: "red",
  [PaymentStatus.TIMEOUT]: "orange",
  [PaymentStatus.MANUAL]: "volcano",
};

export type PaymentMethod = "微信" | "支付宝" | "银联" | "网银" | "B扫C" | "代扣";

export const PaymentMethodOptions: PaymentMethod[] = ["微信", "支付宝", "银联", "网银", "B扫C", "代扣"];

export const PaymentMethodColor: Record<PaymentMethod, string> = {
  "微信": "green",
  "支付宝": "blue",
  "银联": "purple",
  "网银": "geekblue",
  "B扫C": "cyan",
  "代扣": "orange",
};

export type PaymentChannel = "公众号" | "小程序" | "H5" | "App" | "线下扫码";

export const PaymentChannelLabel: Record<PaymentChannel, string> = {
  "公众号": "公众号",
  "小程序": "小程序",
  "H5": "H5",
  "App": "App",
  "线下扫码": "线下扫码",
};

// ============================================================
// Payment（支付单）— 独立于 Order
// ============================================================
export interface Payment extends BaseRecord {
  paymentId: string;             // 支付单号
  orderId: string;               // 关联订单
  paymentMethod: PaymentMethod;  // 支付方式
  channel: PaymentChannel;       // 支付渠道
  transactionScene: "ONLINE" | "OFFLINE";
  // 支付事实（单位：分）；积分和消费券责任在独立资金池建账。
  cashPaidAmount: Cents;
  channelFeeAmount: Cents;
  totalAmount: Cents;
  // 银行回调
  bankTradeNo: string;           // 银行流水号
  bankStatus: string;            // 银行返回的支付状态
  bankFee: Cents;                // 渠道返回的手续费（分）
  bankSettledAt: string;         // 银行实际打款时间
  // 状态
  status: PaymentStatus;         // 支付状态
  callbackReceivedAt: string;    // 回调接收时间
  idempotentKey: string;         // 幂等键
  createdAt: string;
}
