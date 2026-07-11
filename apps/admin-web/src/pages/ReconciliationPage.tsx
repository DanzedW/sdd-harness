// pages/ReconciliationPage.tsx

import React, { useCallback, useState } from "react";
import { Tag, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import { InlineFilterBar } from "../components/backoffice/InlineFilterBar";
import { LedgerTable } from "../components/backoffice/LedgerTable";
import type { ReconciliationRecord, ReconciliationStatus } from "../domain";
import { reconciliationService } from "../services/reconciliationService";
import { ReconciliationStatusColor } from "../domain";

const columns: ColumnsType<ReconciliationRecord> = [
  { title: "对账ID", dataIndex: "reconId", key: "reconId", width: 100 },
  { title: "业务类型", dataIndex: "businessType", key: "businessType", width: 110 },
  { title: "业务引用", dataIndex: "businessReference", key: "businessReference", width: 150 },
  {
    title: "对账状态", dataIndex: "status", key: "status", width: 100,
    render: (v: ReconciliationStatus) => <Tag color={ReconciliationStatusColor[v]}>{v}</Tag>,
  },
  { title: "应有金额", dataIndex: "expectedAmount", key: "expectedAmount", width: 100, render: (v: number) => `¥${(v / 100).toFixed(2)}` },
  { title: "实际金额", dataIndex: "actualAmount", key: "actualAmount", width: 100, render: (v: number) => `¥${(v / 100).toFixed(2)}` },
  { title: "差异", dataIndex: "differenceAmount", key: "differenceAmount", width: 100, render: (v: number) => v === 0 ? <Tag color="green">0</Tag> : <Tag color="red">{`¥${(v / 100).toFixed(2)}`}</Tag> },
  { title: "差异说明", dataIndex: "differenceDescription", key: "differenceDescription", ellipsis: true },
  { title: "处理状态", dataIndex: "resolutionStatus", key: "resolutionStatus", width: 110 },
  { title: "时间", dataIndex: "createdAt", key: "createdAt", width: 160 },
];

const ReconciliationPage: React.FC = () => {
  const [records, setRecords] = useState<ReconciliationRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await reconciliationService.queryRecords({ page, pageSize: 10 }); setRecords(r.items); setTotal(r.total); } finally { setLoading(false); }
  }, [page]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <BackofficePage breadcrumbs={["财务管理", "对账报告"]} title="对账报告">
      <InlineFilterBar filters={[{ key: "keyword", label: "搜索", children: <Input placeholder="搜索对账ID或订单号" /> }]} />
      <LedgerTable<ReconciliationRecord> columns={columns} dataSource={records} loading={loading} pagination={{ total, current: page, pageSize: 10, onChange: setPage }} />
    </BackofficePage>
  );
};

export default ReconciliationPage;
