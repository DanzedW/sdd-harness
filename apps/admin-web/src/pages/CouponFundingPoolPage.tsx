import { Alert, Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import { LedgerTable } from "../components/backoffice/LedgerTable";
import type { CouponFundingBatch, FundingPool } from "../domain";
import { v03MockServices } from "../services/v03MockServices";
import { financialStatusColor, formatCents } from "./v03Ui";

export function CouponFundingPoolPage() {
  const [pools, setPools] = useState<FundingPool[]>([]);
  const [batches, setBatches] = useState<CouponFundingBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      v03MockServices.couponFundingService.listPools(),
      v03MockServices.couponFundingService.listBatches(),
    ])
      .then(([nextPools, nextBatches]) => {
        setPools(nextPools);
        setBatches(nextBatches);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : String(reason)))
      .finally(() => setLoading(false));
  }, []);

  const poolColumns: ColumnsType<FundingPool> = [
    { title: "资金池", dataIndex: "poolCode", width: 150 },
    { title: "责任方", dataIndex: "ownerName", width: 160 },
    { title: "保管主体", dataIndex: "custodianType", width: 120, render: (value: string) => <Tag color={financialStatusColor(value)}>{value}</Tag> },
    { title: "责任模式", dataIndex: "couponFundingMode", width: 210, render: (value: string | null) => <Tag color={financialStatusColor(value ?? "UNCONFIRMED")}>{value ?? "UNCONFIRMED"}</Tag> },
    { title: "现金余额", dataIndex: "cashBalance", width: 110, render: formatCents },
    { title: "已发责任", dataIndex: "issuedLiability", width: 110, render: formatCents },
    { title: "核销占用", dataIndex: "occupiedAmount", width: 110, render: formatCents },
    { title: "已结算", dataIndex: "settledAmount", width: 110, render: formatCents },
    { title: "状态", dataIndex: "status", width: 110, render: (value: string) => <Tag color={financialStatusColor(value)}>{value}</Tag> },
  ];

  const batchColumns: ColumnsType<CouponFundingBatch> = [
    { title: "券资金批次", dataIndex: "batchNo", width: 150 },
    { title: "发券机构", dataIndex: "issuerName", width: 160 },
    { title: "责任模式", dataIndex: "responsibilityMode", width: 210, render: (value: string) => <Tag color={financialStatusColor(value)}>{value}</Tag> },
    { title: "充值", dataIndex: "rechargeAmount", width: 100, render: formatCents },
    { title: "已发责任", dataIndex: "issuedLiability", width: 110, render: formatCents },
    { title: "核销占用", dataIndex: "redeemedOccupiedAmount", width: 110, render: formatCents },
    { title: "商户应收", dataIndex: "merchantReceivableAmount", width: 110, render: formatCents },
    { title: "已结算", dataIndex: "settledAmount", width: 100, render: formatCents },
    { title: "差异", dataIndex: "differenceAmount", width: 100, render: (value: number) => <Tag color={value === 0 ? "green" : "red"}>{formatCents(value)}</Tag> },
    { title: "对账", dataIndex: "reconciliationStatus", width: 110, render: (value: string) => <Tag color={financialStatusColor(value)}>{value}</Tag> },
  ];

  return (
    <BackofficePage breadcrumbs={["统一结算 V0.3", "消费券资金池"]} title="消费券资金池" description="券批次、资金责任方、充值、核销占用、商户应收、结算和差异独立建账。">
      {error ? <Alert type="error" showIcon message="消费券资金池加载失败" description={error} /> : null}
      <Alert type="warning" showIcon message="责任模式待商务确认" description="PREPAID 与 ADVANCE_REIMBURSEMENT 均可表达；当前示例保留 UNCONFIRMED，不默认政府预充值或平台垫资。" />
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <LedgerTable rowKey="id" columns={poolColumns} dataSource={pools} loading={loading} pagination={false} scroll={{ x: 1250 }} />
        <LedgerTable rowKey="id" columns={batchColumns} dataSource={batches} loading={loading} pagination={false} scroll={{ x: 1350 }} />
      </Space>
    </BackofficePage>
  );
}
