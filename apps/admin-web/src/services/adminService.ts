import dayjs from "dayjs";
import { message } from "antd";
import {
  adminAccounts,
  advertisements,
  categories,
  merchants,
  orders,
  productSKUs,
  products,
  roles,
  systemMenus,
  users,
} from "../mocks/data";
import type {
  AdminAccount,
  Advertisement,
  Category,
  Merchant,
  Order,
  Product,
  ProductSKU,
  QueryParams,
  Role,
  SystemMenu,
  User,
} from "../types";
import { OrderStatus } from "../types";
import { ORDER_STATUS_TRANSITIONS, validateOrderStatusTransition } from "../constants/orderStatusMachine";
import { wait } from "./mockClient";
import { createRepository } from "./mockRepository";

// 金额校验守卫：检查金额 >= 0 且为整数（单位：分）
function assertValidCents(value: number, fieldName: string): void {
  if (value < 0 || !Number.isInteger(value)) {
    message.error(`${fieldName} 必须为非负整数（单位：分）`);
    throw new Error(`${fieldName} 必须为非负整数（单位：分），收到 ${value}`);
  }
}

const productRepo = createRepository<Product>("digital-life-admin:products", products, [
  "spuName",
  "spuId",
  "categoryName",
  "merchantName",
  "description",
]);
const productSKURepo = createRepository<ProductSKU>("digital-life-admin:product-skus", productSKUs, [
  "skuId",
  "spuId",
  "barcode",
]);
const categoryRepo = createRepository<Category>("digital-life-admin:categories", categories, ["name", "parentName", "level"]);
const orderRepo = createRepository<Order>("digital-life-admin:orders", orders, [
  "orderNo",
  "userName",
  "merchantName",
  "productName",
]);
const userRepo = createRepository<User>("digital-life-admin:users", users, ["name", "phone", "project", "level"]);
const merchantRepo = createRepository<Merchant>("digital-life-admin:merchants", merchants, ["name", "shortName", "businessType", "contact", "phone", "certNo", "legalPersonName", "legalPersonPhone"]);
const advertisementRepo = createRepository<Advertisement>("digital-life-admin:advertisements", advertisements, [
  "title",
  "position",
  "target",
  "targetType",
]);
const systemMenuRepo = createRepository<SystemMenu>("digital-life-admin:system-menus", systemMenus, [
  "name",
  "path",
  "permission",
]);
const roleRepo = createRepository<Role>("digital-life-admin:roles", roles, ["name"]);
const adminAccountRepo = createRepository<AdminAccount>("digital-life-admin:admin-accounts", adminAccounts, [
  "name",
  "account",
  "role",
  "phone",
]);

// 订单专用查询：支持 orderStatus 和 dateFrom/dateTo 筛选
async function queryOrders(params: QueryParams = {}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const keyword = params.keyword?.trim().toLowerCase();
  const statusFilter = params.status;
  const orderStatusFilter = params.orderStatus;
  const dateFrom = params.dateFrom;
  const dateTo = params.dateTo;

  const allOrders = await orderRepo.all();
  const filtered = allOrders.filter((item) => {
    // BaseRecord.status 筛选（保持向后兼容）
    if (statusFilter && item.status !== statusFilter) return false;
    // OrderStatus 筛选
    if (orderStatusFilter !== undefined && item.orderStatus !== orderStatusFilter) return false;
    // 日期范围筛选（按 paidAt），使用 dayjs 严格化
    if (dateFrom && item.paidAt && item.paidAt < dateFrom) return false;
    if (dateTo && item.paidAt) {
      const endOfDay = dayjs(dateTo).endOf("day").toISOString();
      if (item.paidAt > endOfDay) return false;
    }
    // 关键词搜索
    if (keyword) {
      const searchable = [item.orderNo, item.userName, item.merchantName, item.productName].map((s) =>
        (s ?? "").toLowerCase(),
      );
      if (!searchable.some((s) => s.includes(keyword))) return false;
    }
    return true;
  });

  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
  };
}

// 包装 saveProduct：增加金额校验
async function saveProductWithValidation(record: Product): Promise<Product> {
  assertValidCents(record.price, "售价");
  assertValidCents(record.marketPrice ?? 0, "原价");
  return productRepo.save(record);
}

// 包装 saveOrder：增加金额校验 + 状态机校验 + 结算金额自动计算
async function saveOrderWithValidation(record: Order): Promise<Order> {
  assertValidCents(record.totalAmount ?? 0, "订单总金额");
  assertValidCents(record.payAmount ?? 0, "实付金额");
  assertValidCents(record.freightAmount ?? 0, "运费");
  assertValidCents(record.discountAmount ?? 0, "优惠减免");
  assertValidCents(record.commissionAmount ?? 0, "平台佣金");

  // 结算金额自动计算：settleAmount = payAmount - commissionAmount
  if (record.payAmount !== undefined && record.commissionAmount !== undefined) {
    const calculated = record.payAmount - record.commissionAmount;
    if (calculated < 0) {
      message.error("结算金额不能为负数（实付金额小于佣金）");
      throw new Error(`结算金额不能为负数：实付 ${record.payAmount} - 佣金 ${record.commissionAmount} = ${calculated}`);
    }
    record.settleAmount = calculated;
  }

  // 状态机校验（编辑模式）
  if (record.id) {
    try {
      const allOrders = await orderRepo.all();
      const existing = allOrders.find((o) => o.id === record.id);
      if (existing && existing.orderStatus !== record.orderStatus) {
        if (!validateOrderStatusTransition(existing.orderStatus, record.orderStatus)) {
          message.error(`非法状态转换：从 ${existing.orderStatus} 到 ${record.orderStatus}`);
          throw new Error(`非法状态转换：${existing.orderStatus} → ${record.orderStatus}`);
        }
      }
    } catch (e) {
      if (e instanceof Error) throw e;
    }
  }

  return orderRepo.save(record);
}

export const adminService = {
  login: (account: string, password: string) =>
    wait({
      token: "mock-token",
      name: account || "演示管理员",
      role: password ? "平台管理员" : "访客",
    }),

  dashboard: async () => {
    const [currentOrders, currentUsers, currentMerchants, currentProducts] = await Promise.all([
      orderRepo.all(),
      userRepo.all(),
      merchantRepo.all(),
      productRepo.all(),
    ]);

    // 用户维度
    const totalUsers = currentUsers.length;
    const activeUsers = currentUsers.filter((u) => u.status === "启用").length;
    const orderUserIds = new Set(currentOrders.map((o) => o.userId));
    const orderUsers = orderUserIds.size;
    const coinUserIds = new Set(
      currentOrders
        .filter((o) => (o.coinAmount ?? 0) > 0 || (o.coinCount ?? 0) > 0)
        .map((o) => o.userId),
    );
    const coinUsers = coinUserIds.size;

    // 商品维度（金额单位：分）
    const totalPayAmount = currentOrders.reduce((sum, o) => sum + (o.payAmount ?? 0), 0);
    const totalCoinAmount = currentOrders.reduce((sum, o) => sum + (o.coinAmount ?? 0), 0);
    const totalCommissionAmount = currentOrders.reduce((sum, o) => sum + (o.commissionAmount ?? 0), 0);
    const totalOrderCount = currentOrders.length;

    // 销售数据：totalSettleAmount 只统计 COMPLETED 状态的订单
    const completedOrders = currentOrders.filter((o) => o.orderStatus === OrderStatus.COMPLETED);
    const totalSettleAmount = completedOrders.reduce((sum, o) => sum + (o.settleAmount ?? 0), 0);
    const refundOrders = currentOrders.filter((o) => (o.refundStatus ?? 0) > 0);
    const totalRefundAmount = refundOrders.reduce((sum, o) => sum + (o.refundAmount ?? 0), 0);
    const refundProductCount = refundOrders.reduce((sum, o) => sum + (o.quantity ?? 0), 0);

    // 销售单量：按履约类型（orderType）分别统计
    const salesOrderMap: Record<number, number> = {};
    for (const o of currentOrders) {
      // 只统计已完成/已发货/服务中的订单
      if (o.orderStatus >= 4 && o.orderStatus <= 6) {
        salesOrderMap[o.orderType] = (salesOrderMap[o.orderType] ?? 0) + 1;
      }
    }
    const salesOrderCount = Object.values(salesOrderMap).reduce((sum, c) => sum + c, 0);

    // 履约类型分组
    const orderTypeLabels: Record<number, string> = { 0: "实物邮寄", 1: "到店核销", 2: "上门服务", 3: "虚拟权益" };
    const trends = currentOrders.reduce<Record<string, number>>((acc, order) => {
      const label = orderTypeLabels[order.orderType] ?? "其他";
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    }, {});

    // 待审核商户
    const pendingMerchants = currentMerchants.filter((m) => m.auditStatus === "待审核").length;

    return wait({
      // 用户维度
      totalUsers,
      activeUsers,
      orderUsers,
      coinUsers,
      // 商品维度（单位：分，前台展示时 /100 转元）
      totalPayAmount,
      totalCoinAmount,
      totalCommissionAmount,
      totalOrderCount,
      // 销售数据
      totalSettleAmount,
      salesOrderCount,
      totalRefundAmount,
      refundProductCount,
      // 其他
      pendingMerchants,
      totalMerchants: currentMerchants.length,
      totalProducts: currentProducts.length,
      onSaleProducts: currentProducts.filter((p) => p.status === "上架").length,
      trends: Object.entries(trends).map(([label, value]) => ({ label, value })),
      notices: ["支付回调 Mock 模式运行中", "金币与分账能力仅展示入口", "当前没有真实后端请求"],
    });
  },

  // 商品增强查询：支持按类型、状态、商户筛选
  products: async (params: QueryParams = {}) => {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const keyword = params.keyword?.trim().toLowerCase();
    const statusFilter = params.status;
    const productType = params.productType;
    const merchantId = params.merchantId;

    const allProducts = await productRepo.all();
    const filtered = allProducts.filter((item) => {
      // 状态筛选
      if (statusFilter && item.status !== statusFilter) return false;
      // 商品类型筛选
      if (productType && item.productType !== productType) return false;
      // 商户筛选
      if (merchantId && item.merchantId !== merchantId) return false;
      // 关键词搜索
      if (keyword) {
        const searchable = [item.spuName, item.spuId, item.categoryName, item.merchantName, item.description].map(
          (s) => (s ?? "").toLowerCase(),
        );
        if (!searchable.some((s) => s.includes(keyword))) return false;
      }
      return true;
    });

    // 按 sortOrder 排序
    filtered.sort((a, b) => a.sortOrder - b.sortOrder);

    const start = (page - 1) * pageSize;
    return {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
    };
  },
  saveProduct: saveProductWithValidation,
  removeProduct: productRepo.remove,
  getProductById: async (id: string): Promise<Product | undefined> => {
    const allProducts = await productRepo.all();
    return allProducts.find((item) => item.id === id);
  },
  // SKU 查询
  getProductSKUs: async (spuId: string): Promise<ProductSKU[]> => {
    const all = await productSKURepo.all();
    return all.filter((sku) => sku.spuId === spuId).sort((a, b) => a.sortOrder - b.sortOrder);
  },
  saveProductSKU: productSKURepo.save,
  removeProductSKU: productSKURepo.remove,
  // 分类
  categories: categoryRepo.query,
  getAllCategories: categoryRepo.all,
  saveCategory: categoryRepo.save,
  removeCategory: categoryRepo.remove,
  // 订单使用增强查询（支持 orderStatus + 日期筛选）
  orders: queryOrders,
  saveOrder: saveOrderWithValidation,
  removeOrder: orderRepo.remove,
  // 用户
  users: userRepo.query,
  saveUser: userRepo.save,
  removeUser: userRepo.remove,
  // 商户
  merchants: merchantRepo.query,
  saveMerchant: merchantRepo.save,
  removeMerchant: merchantRepo.remove,
  // 审核流程
  auditMerchant: async (id: string, auditStatus: "审核通过" | "审核驳回", rejectReason?: string) => {
    const merchants = await merchantRepo.all();
    const index = merchants.findIndex((m) => m.id === id);
    if (index === -1) throw new Error("商户不存在");
    const updated = {
      ...merchants[index],
      auditStatus,
      rejectReason: rejectReason ?? "",
      updatedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      status: auditStatus === "审核通过" ? "启用" : merchants[index].status,
    } as Merchant;
    return merchantRepo.save(updated);
  },
  batchAudit: async (ids: string[], auditStatus: "审核通过" | "审核驳回", rejectReason?: string) => {
    const merchants = await merchantRepo.all();
    const results: Merchant[] = [];
    for (const id of ids) {
      const index = merchants.findIndex((m) => m.id === id);
      if (index === -1) continue;
      const updated = {
        ...merchants[index],
        auditStatus,
        rejectReason: rejectReason ?? "",
        updatedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
        status: auditStatus === "审核通过" ? "启用" : merchants[index].status,
      } as Merchant;
      results.push(await merchantRepo.save(updated));
    }
    return results;
  },
  // 广告
  advertisements: advertisementRepo.query,
  saveAdvertisement: advertisementRepo.save,
  removeAdvertisement: advertisementRepo.remove,
  // 系统菜单
  systemMenus: systemMenuRepo.query,
  saveSystemMenu: systemMenuRepo.save,
  removeSystemMenu: systemMenuRepo.remove,
  // 角色
  roles: roleRepo.query,
  saveRole: roleRepo.save,
  removeRole: roleRepo.remove,
  // 管理员账号
  adminAccounts: adminAccountRepo.query,
  saveAdminAccount: adminAccountRepo.save,
  removeAdminAccount: adminAccountRepo.remove,
  // 结算查询：过滤已完成的订单，支持关键词和结算状态筛选
  settleOrders: async (params: QueryParams = {}): Promise<{ items: Order[]; total: number }> => {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const keyword = params.keyword?.trim().toLowerCase();
    const merchantId = params.merchantId;
    const dateFrom = params.dateFrom;
    const dateTo = params.dateTo;
    const settlementStatus = params.settlementStatus;

    const allOrders = await orderRepo.all();
    const settlementOrders = allOrders.filter((o) => {
      // 只展示 COMPLETED 或 REFUNDED 的订单
      if (o.orderStatus !== OrderStatus.COMPLETED && o.orderStatus !== OrderStatus.REFUNDED) return false;
      if (merchantId && o.merchantId !== merchantId) return false;
      if (dateFrom && o.completedAt && o.completedAt < dateFrom) return false;
      if (dateTo && o.completedAt) {
        const endOfDay = dayjs(dateTo).endOf("day").toISOString();
        if (o.completedAt > endOfDay) return false;
      }
      // 关键词搜索（按 merchantName 或 orderNo）
      if (keyword) {
        const searchable = [o.merchantName, o.orderNo].map((s) => (s ?? "").toLowerCase());
        if (!searchable.some((s) => s.includes(keyword))) return false;
      }
      // 结算状态筛选（基于业务规则：已退款→已结算，已完成→待结算）
      if (settlementStatus === "pending" && o.orderStatus !== OrderStatus.COMPLETED) return false;
      if (settlementStatus === "settled" && o.orderStatus !== OrderStatus.REFUNDED) return false;
      return true;
    });

    const start = (page - 1) * pageSize;
    return {
      items: settlementOrders.slice(start, start + pageSize),
      total: settlementOrders.length,
    };
  },
  submitSettlement: async (_orderId: string): Promise<void> => {
    message.success("发起结算成功（Mock 操作）");
    await wait(undefined);
  },
  // 物流查询
  logisticsOrders: async (params: QueryParams = {}): Promise<{ items: Order[]; total: number }> => {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const keyword = params.keyword?.trim().toLowerCase();
    const trackingCompany = params.trackingCompany;
    const dateFrom = params.dateFrom;
    const dateTo = params.dateTo;

    const allOrders = await orderRepo.all();
    const logisticsOrders = allOrders.filter((o) => {
      // 只展示待发货或已发货的实物订单
      if (o.orderStatus !== OrderStatus.PENDING_DELIVERY && o.orderStatus !== OrderStatus.SHIPPED) return false;
      // 只展示实物邮寄类型
      if (o.orderType !== 0) return false;
      if (dateFrom && o.createdAt && o.createdAt < dateFrom) return false;
      if (dateTo && o.createdAt) {
        const endOfDay = dayjs(dateTo).endOf("day").toISOString();
        if (o.createdAt > endOfDay) return false;
      }
      // 快递公司筛选
      if (trackingCompany && o.trackingCompany !== trackingCompany) return false;
      if (keyword) {
        const searchable = [o.productName, o.trackingCompany, o.trackingNo].map((s) => (s ?? "").toLowerCase());
        if (!searchable.some((s) => s.includes(keyword))) return false;
      }
      return true;
    });

    const start = (page - 1) * pageSize;
    return {
      items: logisticsOrders.slice(start, start + pageSize),
      total: logisticsOrders.length,
    };
  },
  // 发货操作
  shipOrder: async (orderId: string, trackingCompany: string, trackingNo: string): Promise<Order> => {
    const allOrders = await orderRepo.all();
    const order = allOrders.find((o) => o.id === orderId);
    if (!order) throw new Error("订单不存在");
    const updated: Order = {
      ...order,
      trackingCompany,
      trackingNo,
      orderStatus: OrderStatus.SHIPPED,
      shippedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
      updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
    };
    return orderRepo.save(updated);
  },
  // 退款查询
  refundOrders: async (params: QueryParams = {}): Promise<{ items: Order[]; total: number }> => {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const keyword = params.keyword?.trim().toLowerCase();
    const refundStatus = params.refundStatus;
    const dateFrom = params.dateFrom;
    const dateTo = params.dateTo;

    const allOrders = await orderRepo.all();
    const refundOrders = allOrders.filter((o) => {
      // 有退款相关数据的订单
      if ((o.refundStatus ?? 0) === 0 && (o.refundAmount ?? 0) <= 0) return false;
      // 退款状态筛选
      if (refundStatus !== undefined && o.refundStatus !== refundStatus) return false;
      if (dateFrom && o.refundedAt && o.refundedAt < dateFrom) return false;
      if (dateTo && o.refundedAt) {
        const endOfDay = dayjs(dateTo).endOf("day").toISOString();
        if (o.refundedAt > endOfDay) return false;
      }
      if (keyword) {
        const searchable = [o.orderNo, o.merchantName, o.productName].map((s) => (s ?? "").toLowerCase());
        if (!searchable.some((s) => s.includes(keyword))) return false;
      }
      return true;
    });

    const start = (page - 1) * pageSize;
    return {
      items: refundOrders.slice(start, start + pageSize),
      total: refundOrders.length,
    };
  },
  // 获取所有商户列表（用于下拉选择）
  getAllMerchants: merchantRepo.all,
  // 获取分类下商品数量（用于删除检查）
  getCategoryProductCount: async (categoryId: string): Promise<number> => {
    const allProducts = await productRepo.all();
    return allProducts.filter((p) => p.categoryId === categoryId).length;
  },
};
