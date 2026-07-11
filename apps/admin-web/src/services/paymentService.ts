// services/paymentService.ts — 支付 Mock Service

import type { Payment, PageResult, QueryParams } from "../domain";
import { payments } from "../mocks/data-payment";
import { createRepository } from "./mockRepository";

const paymentRepo = createRepository<Payment>(
  "digital-life-admin:payments",
  payments,
  ["paymentId", "orderId", "bankTradeNo"]
);

export const paymentService = {
  queryPayments: (params?: QueryParams): Promise<PageResult<Payment>> =>
    paymentRepo.query(params),

  getPaymentByOrderId: async (orderId: string): Promise<Payment | undefined> => {
    const all = await paymentRepo.all();
    return all.find((p) => p.orderId === orderId);
  },
};
