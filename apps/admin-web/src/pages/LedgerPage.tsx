// pages/LedgerPage.tsx

import React, { useCallback, useState } from "react";
import { Tag, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import { InlineFilterBar } from "../components/backoffice/InlineFilterBar";
import { LedgerTable } from "../components/backoffice/LedgerTable";
import type { LedgerEntry, LedgerType, LedgerDirection } from "../domain";
import { ledgerService } from "../services/ledgerService";
import { LedgerTypeLabel } from "../domain";

const columns: ColumnsType<LedgerEntry> = [
  { title: "分录ID", dataIndex: "entryId", key: "entryId", width: 110 },
  { title: "类型", dataIndex: "type", key: "type", width: 120, render: (v: LedgerType) => <Tag color="blue">{LedgerTypeLabel[v]}</Tag> },
  { title: "方向", dataIndex: "direction", key: "direction", width: 50, render: (v: LedgerDirection) => <Tag color={v === "借" ? "green" : "red"}>{v}</Tag> },
  { title: "金额", dataIndex: "amount", key: "amount", width: 100, render: (v: number) => `¥${(v / 100).toFixed(2)}` },
  { title: "订单号", dataIndex: "orderId", key: "orderId", width: 170 },
  { title: "摘要", dataIndex: "description", key: "description", ellipsis: true },
  { title: "对账", dataIndex: "reconciliationStatus", key: "reconciliationStatus", width: 110 },
  { title: "时间", dataIndex: "createdAt", key: "createdAt", width: 160 },
];

const LedgerPage: React.FC = () => {
  const [records, setRecords] = useState<LedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await ledgerService.queryEntries({ page, pageSize: 10 }); setRecords(r.items); setTotal(r.total); } finally { setLoading(false); }
  }, [page]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <BackofficePage breadcrumbs={["财务管理", "记账分录"]} title="记账分录">
      <InlineFilterBar filters={[{ key: "keyword", label: "搜索", children: <Input placeholder="搜索分录ID或订单号" /> }]} />
      <LedgerTable<LedgerEntry> columns={columns} dataSource={records} loading={loading} pagination={{ total, current: page, pageSize: 10, onChange: setPage }} />
    </BackofficePage>
  );
};

export default LedgerPage;
