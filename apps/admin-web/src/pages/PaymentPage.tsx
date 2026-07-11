// pages/PaymentPage.tsx

import React, { useCallback, useState } from "react";
import { Tag, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import { InlineFilterBar } from "../components/backoffice/InlineFilterBar";
import { LedgerTable } from "../components/backoffice/LedgerTable";
import type { Payment, PaymentStatus, PaymentMethod } from "../domain";
import { paymentService } from "../services/paymentService";
import { PaymentStatusColor, PaymentMethodColor } from "../domain";

const columns: ColumnsType<Payment> = [
  { title: "支付单号", dataIndex: "paymentId", key: "paymentId", width: 140 },
  { title: "订单号", dataIndex: "orderId", key: "orderId", width: 170 },
  { title: "支付方式", dataIndex: "paymentMethod", key: "paymentMethod", width: 80, render: (v: PaymentMethod) => <Tag color={PaymentMethodColor[v]}>{v}</Tag> },
  { title: "状态", dataIndex: "status", key: "status", width: 100, render: (v: PaymentStatus) => <Tag color={PaymentStatusColor[v]}>{v}</Tag> },
  { title: "场景", dataIndex: "transactionScene", key: "transactionScene", width: 80, render: (v: Payment["transactionScene"]) => v === "ONLINE" ? "线上" : "线下" },
  { title: "应付现金", dataIndex: "totalAmount", key: "total", width: 100, render: (v: number) => `¥${(v / 100).toFixed(2)}` },
  { title: "成功实付", dataIndex: "cashPaidAmount", key: "cashPaid", width: 100, render: (v: number) => `¥${(v / 100).toFixed(2)}` },
  { title: "渠道费", dataIndex: "channelFeeAmount", key: "channelFee", width: 90, render: (v: number) => `¥${(v / 100).toFixed(2)}` },
  { title: "银行流水", dataIndex: "bankTradeNo", key: "bankTradeNo", width: 180, render: (v: string) => v || "-" },
  { title: "手续费", key: "fee", width: 80, render: (_: unknown, r: Payment) => r.bankFee > 0 ? `¥${(r.bankFee / 100).toFixed(2)}` : "-" },
  { title: "时间", dataIndex: "createdAt", key: "createdAt", width: 160 },
];

const PaymentPage: React.FC = () => {
  const [records, setRecords] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await paymentService.queryPayments({ page, pageSize: 10 }); setRecords(r.items); setTotal(r.total); } finally { setLoading(false); }
  }, [page]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <BackofficePage breadcrumbs={["财务管理", "支付记录"]} title="支付记录">
      <InlineFilterBar filters={[{ key: "keyword", label: "搜索", children: <Input placeholder="搜索支付单号或订单号" /> }]} />
      <LedgerTable<Payment> columns={columns} dataSource={records} loading={loading} pagination={{ total, current: page, pageSize: 10, onChange: setPage }} />
    </BackofficePage>
  );
};

export default PaymentPage;
