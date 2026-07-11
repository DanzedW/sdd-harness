// pages/CoinRecordPage.tsx — 积分流水查询（只读）

import React, { useCallback, useState } from "react";
import { Tag, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import { InlineFilterBar } from "../components/backoffice/InlineFilterBar";
import { LedgerTable } from "../components/backoffice/LedgerTable";
import type { CoinRecord, CoinDirection } from "../domain";
import { coinService } from "../services/coinService";
import { CoinDirectionColor } from "../domain";

const columns: ColumnsType<CoinRecord> = [
  { title: "流水ID", dataIndex: "recordId", key: "recordId", width: 100 },
  {
    title: "方向", dataIndex: "direction", key: "direction", width: 70,
    render: (v: CoinDirection) => <Tag color={CoinDirectionColor[v]}>{v}</Tag>,
  },
  { title: "数量", dataIndex: "amount", key: "amount", width: 70 },
  { title: "来源", dataIndex: "source", key: "source", ellipsis: true },
  { title: "变动前", dataIndex: "balanceBefore", key: "balanceBefore", width: 70 },
  { title: "变动后", dataIndex: "balanceAfter", key: "balanceAfter", width: 70 },
  { title: "关联订单", dataIndex: "orderId", key: "orderId", width: 180, render: (v: string | null) => v || "-" },
  { title: "时间", dataIndex: "createdAt", key: "createdAt", width: 160 },
];

const CoinRecordPage: React.FC = () => {
  const [records, setRecords] = useState<CoinRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await coinService.queryRecords({ page, pageSize });
      setRecords(r.items);
      setTotal(r.total);
    } finally { setLoading(false); }
  }, [page]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <BackofficePage breadcrumbs={["财务管理", "积分流水"]} title="积分流水">
      <InlineFilterBar filters={[{ key: "keyword", label: "搜索", children: <Input placeholder="搜索用户ID或来源" /> }]} />
      <LedgerTable<CoinRecord>
        columns={columns}
        dataSource={records}
        loading={loading}
        pagination={{ total, current: page, pageSize: 10, onChange: setPage }}
      />
    </BackofficePage>
  );
};

export default CoinRecordPage;
