// services/couponService.ts — 消费券 Mock Service

import type { CouponTemplate, UserCoupon, PageResult, QueryParams } from "../domain";
import { couponTemplates, userCoupons } from "../mocks/data-coupon";
import { createRepository } from "./mockRepository";

const templateRepo = createRepository<CouponTemplate>(
  "digital-life-admin:coupon-templates",
  couponTemplates,
  ["templateId", "name"]
);

const userCouponRepo = createRepository<UserCoupon>(
  "digital-life-admin:user-coupons",
  userCoupons,
  ["couponId", "templateName", "userId"]
);

let _idCounter = 100;

function uid(): string {
  return `gen-${Date.now()}-${++_idCounter}`;
}

export const couponService = {
  queryTemplates: (params?: QueryParams): Promise<PageResult<CouponTemplate>> =>
    templateRepo.query(params),

  getTemplate: async (templateId: string): Promise<CouponTemplate | undefined> => {
    const all = await templateRepo.all();
    return all.find((t) => t.templateId === templateId);
  },

  createTemplate: (data: Omit<CouponTemplate, "id" | "usedCount" | "updatedAt">) =>
    templateRepo.save({
      ...data,
      id: uid(),
      usedCount: 0,
      updatedAt: new Date().toISOString(),
    } as CouponTemplate),

  updateTemplate: (id: string, data: Partial<CouponTemplate>) =>
    templateRepo.save({ ...data, id } as CouponTemplate),

  deleteTemplate: (id: string) => templateRepo.remove(id),

  queryUserCoupons: (params?: QueryParams): Promise<PageResult<UserCoupon>> =>
    userCouponRepo.query(params),

  getAvailableCoupons: async (userId: string): Promise<UserCoupon[]> => {
    const all = await userCouponRepo.all();
    const now = new Date().toISOString();
    return all.filter(
      (c) => c.userId === userId && c.status === "未使用" && c.expiredAt > now
    );
  },

  lockCoupon: async (couponId: string, orderId: string): Promise<void> => {
    const all = await userCouponRepo.all();
    const c = all.find((x) => x.couponId === couponId);
    if (c) {
      await userCouponRepo.save({
        ...c,
        status: "已锁定",
        lockedAt: new Date().toISOString(),
        usedOrderId: orderId,
      });
    }
  },

  useCoupon: async (couponId: string): Promise<void> => {
    const all = await userCouponRepo.all();
    const c = all.find((x) => x.couponId === couponId);
    if (c) {
      await userCouponRepo.save({ ...c, status: "已使用", usedAt: new Date().toISOString() });
      const templates = await templateRepo.all();
      const t = templates.find((x) => x.templateId === c.templateId);
      if (t) {
        await templateRepo.save({ ...t, usedCount: t.usedCount + 1 });
      }
    }
  },

  unlockCoupon: async (couponId: string): Promise<void> => {
    const all = await userCouponRepo.all();
    const c = all.find((x) => x.couponId === couponId);
    if (c && c.status === "已锁定") {
      await userCouponRepo.save({ ...c, status: "未使用", lockedAt: "", usedOrderId: "" });
    }
  },
};
