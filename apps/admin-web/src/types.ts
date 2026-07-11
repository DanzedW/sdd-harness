// types.ts — 向后兼容的重新导出（所有类型定义已迁移到 domain/）
// 新代码请直接 import from "domain/xxx"

export type BaseStatus = "启用" | "停用" | "草稿" | "待审核" | "已完成" | "处理中" | "异常";
export type Status = BaseStatus;

export {
  // base
  type BaseRecord,
  type PageResult,
  type QueryParams,
  type FieldConfig,
  // merchant
  type Merchant,
  type Contract,
  type Shop,
  type QrCode,
  // product
  type Product,
  type ProductSKU,
  type Category,
  type ProductStatus,
  type ProductType,
  ProductTypeOptions,
  ProductTypeColor,
  ProductStatusColor,
  // order
  OrderStatus,
  OrderStatusLabel,
  OrderStatusColor,
  OrderTypeLabel,
  type Order,
  // payment
  PaymentStatus,
  PaymentStatusColor,
  type PaymentMethod,
  PaymentMethodOptions,
  PaymentMethodColor,
  type PaymentChannel,
  PaymentChannelLabel,
  type Payment,
  // settlement
  type SplitInstruction,
  type MerchantSettlement,
  // ledger
  type LedgerType,
  LedgerTypeLabel,
  type LedgerDirection,
  type LedgerEntry,
  // coupon
  type CouponType,
  CouponTypeLabel,
  type CouponTemplate,
  type UserCouponStatus,
  UserCouponStatusColor,
  type UserCoupon,
  // coin
  type CoinDirection,
  CoinDirectionColor,
  type CoinRecord,
  // reconciliation
  type ReconciliationStatus,
  ReconciliationStatusColor,
  type ReconciliationRecord,
  // user
  type User,
  // admin
  type SystemMenu,
  type Role,
  type AdminAccount,
  // ad
  PositionOptions,
  type Position,
  PositionColor,
  TargetTypeOptions,
  type TargetType,
  TargetTypeColor,
  type Advertisement,
} from "./domain";
