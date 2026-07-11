import { OrderStatus } from "../types";

// 订单状态机映射表：每个状态允许转换到的目标状态列表
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.CLOSED, OrderStatus.PENDING_DELIVERY, OrderStatus.PENDING_VERIFY, OrderStatus.PENDING_SERVICE],
  [OrderStatus.PENDING_DELIVERY]: [OrderStatus.SHIPPED, OrderStatus.CLOSED],
  [OrderStatus.PENDING_VERIFY]: [OrderStatus.COMPLETED, OrderStatus.CLOSED],
  [OrderStatus.PENDING_SERVICE]: [OrderStatus.IN_SERVICE, OrderStatus.CLOSED],
  [OrderStatus.SHIPPED]: [OrderStatus.COMPLETED, OrderStatus.REFUNDING],
  [OrderStatus.IN_SERVICE]: [OrderStatus.COMPLETED, OrderStatus.REFUNDING],
  [OrderStatus.COMPLETED]: [OrderStatus.REFUNDING, OrderStatus.PARTIAL_REFUND],
  [OrderStatus.REFUNDING]: [OrderStatus.REFUNDED, OrderStatus.REFUND_FAILED, OrderStatus.PARTIAL_REFUND],
  [OrderStatus.REFUNDED]: [],
  [OrderStatus.REFUND_FAILED]: [OrderStatus.REFUNDING],
  [OrderStatus.CLOSED]: [],
  [OrderStatus.PARTIAL_REFUND]: [OrderStatus.REFUNDING],
};

export function validateOrderStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  const allowed = ORDER_STATUS_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}
