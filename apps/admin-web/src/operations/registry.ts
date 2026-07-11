import source from "../../../../experiment/requirements.pc.json";

export interface OperationRequirement {
  id: string;
  excelRow: number;
  group: string;
  module: string;
  detail: string;
  sourceSha256: string;
  unconfirmed: boolean;
}

export interface OperationDomain {
  name: string;
  slug: string;
  count: number;
  unconfirmedCount: number;
}

export const OPERATION_REQUIREMENTS = source.requirements as OperationRequirement[];

export const OPERATION_DOMAINS: OperationDomain[] = Array.from(
  OPERATION_REQUIREMENTS.reduce((groups, requirement) => {
    const current = groups.get(requirement.group) ?? { count: 0, unconfirmedCount: 0 };
    current.count += 1;
    current.unconfirmedCount += requirement.unconfirmed ? 1 : 0;
    groups.set(requirement.group, current);
    return groups;
  }, new Map<string, { count: number; unconfirmedCount: number }>()),
  ([name, summary]) => ({
    name,
    slug: ({
      "内容运营": "content", "用户管理": "users", "发票抽奖": "invoice-lottery", "分类信息": "classified-information",
      "商家管理": "merchants", "电商管理": "commerce", "积分管理": "points", "票券管理": "vouchers",
      "积分权益": "point-benefits", "活动报名": "events", "生活缴费管理": "utility-payments", "小程序管理": "mini-program",
      "焦点图": "banners", "平台协议与常见问题": "agreements-and-faq", "财务管理": "finance", "系统管理": "system",
      "到家服务管理": "home-services",
    } as Record<string, string>)[name],
    ...summary,
  }),
);

export function getRequirement(id: string) {
  return OPERATION_REQUIREMENTS.find((item) => item.id === id);
}

export function getDomainBySlug(slug?: string) {
  return OPERATION_DOMAINS.find((item) => item.slug === slug);
}
