// 基础类型 — 所有领域实体的基类和通用工具类型

export interface BaseRecord {
  id: string;
  status: string;
  updatedAt: string;
}

/** 金额单位固定为人民币分；运行时仍须通过 assertValidCents 校验。 */
export type Cents = number;

/** 比例单位固定为基点（0-10000）；运行时仍须通过 assertValidBasisPoints 校验。 */
export type BasisPoints = number;

export type UnconfirmedState = "UNCONFIRMED";

export interface PageResult<T> {
  items: T[];
  total: number;
}

export interface QueryParams {
  keyword?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  // 订单专用筛选
  orderStatus?: number;
  dateFrom?: string;
  dateTo?: string;
  // 商品专用筛选
  productType?: string;
  merchantId?: string;
  // 结算专用筛选
  settlementStatus?: string;
  // 退款专用筛选
  refundStatus?: number;
  // 物流专用筛选
  trackingCompany?: string;
}

export interface FieldConfig<T> {
  key: keyof T;
  label: string;
  type?: "text" | "number" | "select";
  options?: string[];
  required?: boolean;
}
