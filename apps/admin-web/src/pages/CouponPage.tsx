// pages/CouponPage.tsx — 消费券模板管理

import React from "react";
import { Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CrudTablePage } from "../components/CrudTablePage";
import type { CouponTemplate, CouponType } from "../domain";
import { couponService } from "../services/couponService";
import { CouponTypeLabel } from "../domain";

const columns: ColumnsType<CouponTemplate> = [
  { title: "模板ID", dataIndex: "templateId", key: "templateId", width: 100 },
  { title: "名称", dataIndex: "name", key: "name", width: 140 },
  {
    title: "类型", dataIndex: "type", key: "type", width: 90,
    render: (v: CouponType) => <Tag color={v === "FIXED" ? "blue" : "purple"}>{CouponTypeLabel[v]}</Tag>,
  },
  {
    title: "面额/折扣", key: "faceValue", width: 130,
    render: (_: unknown, r: CouponTemplate) =>
      r.type === "FIXED" ? `¥${(r.value / 100).toFixed(2)}` : `${r.value}%（最高减¥${(r.maxDiscount / 100).toFixed(0)}）`,
  },
  {
    title: "消费门槛", dataIndex: "minAmount", key: "minAmount", width: 100,
    render: (v: number) => (v > 0 ? `¥${(v / 100).toFixed(2)}` : "无"),
  },
  { title: "发放/已用", key: "usage", width: 100, render: (_: unknown, r: CouponTemplate) => `${r.usedCount}/${r.totalCount}` },
  { title: "有效起", dataIndex: "validFrom", key: "validFrom", width: 100 },
  { title: "有效止", dataIndex: "validTo", key: "validTo", width: 100 },
];

const fields = [
  { key: "templateId" as keyof CouponTemplate, label: "模板ID" },
  { key: "name" as keyof CouponTemplate, label: "名称" },
  { key: "type" as keyof CouponTemplate, label: "类型" },
  { key: "value" as keyof CouponTemplate, label: "面额/折扣", type: "number" as const },
  { key: "minAmount" as keyof CouponTemplate, label: "最低消费(分)", type: "number" as const },
  { key: "maxDiscount" as keyof CouponTemplate, label: "最大抵扣(分)", type: "number" as const },
  { key: "totalCount" as keyof CouponTemplate, label: "发放量", type: "number" as const },
  { key: "description" as keyof CouponTemplate, label: "说明" },
];

const CouponPage: React.FC = () => (
  <CrudTablePage<CouponTemplate>
    title="消费券模板"
    description="管理平台消费券模板，新建后用户可在支付时选用"
    searchPlaceholder="搜索模板ID或名称"
    columns={columns}
    fields={fields}
    fetcher={(params) => couponService.queryTemplates(params)}
    saver={(r) => couponService.createTemplate(r as any)}
    remover={(id) => couponService.deleteTemplate(id)}
  />
);

export default CouponPage;
