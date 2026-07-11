// 商户领域 — Merchant / Contract / Shop / QrCode

import type { BaseRecord, BasisPoints } from "./base";

export type SettlementCycleType = "T_PLUS_1" | "T_PLUS_N" | "UNCONFIRMED";
export type RewardBaseType = "GROSS" | "CASH_PAID" | "MERCHANT_DISCOUNT" | "UNCONFIRMED";
export type SettlementProfileStatus = "DRAFT" | "ACTIVE" | "EXPIRED" | "UNCONFIRMED";

export interface MerchantSettlementProfile extends BaseRecord {
  merchantId: string;
  shopId: string | null;
  version: number;
  merchantRateBps: BasisPoints;
  platformRateBps: BasisPoints;
  channelFeeRateBps: BasisPoints;
  rewardPointRateBps: BasisPoints;
  rewardBaseType: RewardBaseType;
  settlementCycleType: SettlementCycleType;
  settlementDays: number | null;
  onlineEnabled: boolean;
  offlineEnabled: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: SettlementProfileStatus;
}

export type MerchantSettlementProfileSnapshot = Readonly<MerchantSettlementProfile>;

// ============================================================
// Merchant（商户）— 入驻后创建
// ============================================================
export interface Merchant extends BaseRecord {
  name: string;
  shortName?: string;
  businessType: string;
  merchantLevel?: "普通商户" | "金牌商户" | "战略合作";
  subjectType?: "企业法人" | "个体工商户" | "事业单位";
  contact: string;
  phone: string;
  legalPersonName?: string;
  legalPersonPhone?: string;
  certNo?: string;
  certImageFront?: string;
  certImageBack?: string;
  businessLicenseImage?: string;
  province?: string;
  city?: string;
  district?: string;
  address: string;
  coordinate?: string;
  logo?: string;
  description?: string;
  registeredAt?: string;
  registeredCapital?: number;
  productCategories?: string[];
  settlementRateBps?: BasisPoints;
  auditStatus?: "待审核" | "审核通过" | "审核驳回";
  rejectReason?: string;
  status: string;
}

// ============================================================
// Contract（合同）— 商户签订
// ============================================================
export interface Contract extends BaseRecord {
  contractNo: string;          // 合同编号，唯一
  merchantId: string;           // 关联商户
  validFrom: string;            // 生效日期
  validTo: string;              // 到期日期
  feeRateBps: BasisPoints;
  settlementRateBps: BasisPoints;
  settlementCycleType: SettlementCycleType;
  settlementDays: number | null;
  signedAt: string;             // 签约时间
  status: "生效" | "已过期" | "已终止";
}

// ============================================================
// Shop（店铺）— 商户下的经营单位
// ============================================================
export interface Shop extends BaseRecord {
  shopCode: string;             // 店铺编码，平台内唯一
  merchantId: string;           // 归属商户
  name: string;
  contactName: string;          // 联系人
  contactPhone: string;         // 联系电话
  platformRateBps: BasisPoints;
  // 支付配置
  acceptWechat: boolean;        // 是否支持微信
  acceptAlipay: boolean;        // 是否支持支付宝
  acceptUnionPay: boolean;      // 是否支持银联
  acceptBScanC: boolean;        // 是否支持 B扫C
  // 金币/积分配置
  supportCoin: boolean;         // 是否支持金币支付
  coinDiscountRateBps: BasisPoints;
  coinCap: number;              // 金币抵扣封顶（分）
  // 返金币配置
  supportCashback: boolean;     // 是否支持消费返金币
  cashbackRateBps: BasisPoints;
  cashbackCap: number;          // 返金币封顶（分）
  status: "启用" | "停用";
}

// ============================================================
// QrCode（收款码）— 按店铺生成
// ============================================================
export interface QrCode extends BaseRecord {
  shopId: string;               // 归属店铺
  merchantId: string;           // 归属商户（冗余，方便查询）
  code: string;                 // 收款码编码
  qrImageUrl: string;           // 二维码图片 URL
  type: "固定金额" | "可变金额";
  fixedAmount?: number;         // 固定收款金额（分），type=固定金额时有效
  status: "启用" | "停用";
  boundDevice?: string;         // 绑定的云喇叭设备 ID
  createdAt: string;
}
