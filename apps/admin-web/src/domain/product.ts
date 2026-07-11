// 商品领域 — Product / ProductSKU / Category

import type { BaseRecord, BasisPoints } from "./base";

export type ProductStatus = "草稿" | "待审核" | "上架" | "下架";
export type ProductType = "实物邮寄" | "到店核销" | "上门服务" | "虚拟权益";

export const ProductTypeOptions: ProductType[] = ["实物邮寄", "到店核销", "上门服务", "虚拟权益"];

export const ProductTypeColor: Record<ProductType, string> = {
  "实物邮寄": "blue",
  "到店核销": "purple",
  "上门服务": "cyan",
  "虚拟权益": "gold",
};

export const ProductStatusColor: Record<ProductStatus, string> = {
  "草稿": "default",
  "待审核": "orange",
  "上架": "green",
  "下架": "red",
};

export interface Category extends BaseRecord {
  name: string;
  parentId: string | null;
  parentName?: string;
  level: "一级" | "二级" | "三级";
  sort: number;
}

export interface Product extends BaseRecord {
  spuId: string;
  spuName: string;
  categoryId: string;
  categoryName: string;
  merchantId: string;
  merchantName: string;
  productType: ProductType;
  price: number;
  marketPrice: number;
  stock: number;
  sales: number;
  salesLimit: number;
  description: string;
  images: string;
  details: string;
  freightTemplateId: string;
  supportCoin: boolean;
  coinDiscountRateBps: BasisPoints;
  sortOrder: number;
  status: ProductStatus;
  createdAt: string;
}

export interface ProductSKU extends BaseRecord {
  skuId: string;
  spuId: string;
  specValues: string;
  price: number;
  stock: number;
  sales: number;
  image: string;
  barcode: string;
  sortOrder: number;
  status: "启用" | "停用";
}
