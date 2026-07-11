import { Alert, Descriptions, Form, Input, Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import { DetailModal } from "../components/backoffice/DetailModal";
import { InlineFilterBar } from "../components/backoffice/InlineFilterBar";
import { LedgerTable } from "../components/backoffice/LedgerTable";
import type { MerchantSettlementProfile } from "../domain";
import { v03MockServices } from "../services/v03MockServices";
import { financialStatusColor } from "./v03Ui";

function cycleText(profile: MerchantSettlementProfile) {
  if (profile.settlementCycleType === "UNCONFIRMED") return "待商务确认";
  return profile.settlementCycleType === "T_PLUS_1" ? "T+1" : `T+${profile.settlementDays}`;
}

export function SettlementProfilePage() {
  const [records, setRecords] = useState<MerchantSettlementProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<MerchantSettlementProfile | null>(null);

  useEffect(() => {
    v03MockServices.settlementProfileService
      .list()
      .then(setRecords)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : String(reason)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => records.filter((item) => `${item.merchantId} ${item.shopId ?? ""}`.toLowerCase().includes(keyword.trim().toLowerCase())),
    [keyword, records],
  );

  const columns: ColumnsType<MerchantSettlementProfile> = [
    { title: "商户", dataIndex: "merchantId", width: 100 },
    { title: "店铺", dataIndex: "shopId", width: 100, render: (value: string | null) => value ?? "全部店铺" },
    { title: "版本", dataIndex: "version", width: 70, render: (value: number) => `V${value}` },
    { title: "商户应收", dataIndex: "merchantRateBps", width: 95, render: (value: number) => `${value} bps` },
    { title: "平台收益", dataIndex: "platformRateBps", width: 95, render: (value: number) => `${value} bps` },
    { title: "渠道费", dataIndex: "channelFeeRateBps", width: 90, render: (value: number) => `${value} bps` },
    { title: "返积分", dataIndex: "rewardPointRateBps", width: 90, render: (value: number) => `${value} bps` },
    {
      title: "比例守恒",
      width: 90,
      render: (_, record) => {
        const total = record.merchantRateBps + record.platformRateBps + record.channelFeeRateBps + record.rewardPointRateBps;
        return <Tag color={total === 10_000 ? "green" : "red"}>{total} bps</Tag>;
      },
    },
    { title: "返积分基数", dataIndex: "rewardBaseType", width: 130, render: (value: string) => <Tag color={financialStatusColor(value)}>{value}</Tag> },
    { title: "账期", width: 90, render: (_, record) => cycleText(record) },
    { title: "生效日", dataIndex: "effectiveFrom", width: 110 },
    { title: "状态", dataIndex: "status", width: 110, render: (value: string) => <Tag color={financialStatusColor(value)}>{value}</Tag> },
    { title: "操作", fixed: "right", width: 90, render: (_, record) => <a onClick={() => setSelected(record)}>查看快照</a> },
  ];

  return (
    <BackofficePage
      breadcrumbs={["统一结算 V0.3", "商户结算画像"]}
      title="商户结算画像"
      description="每个商户独立维护比例、返积分基数、T+1/T+N 账期和生效版本；历史交易保存画像快照。"
    >
      {error ? <Alert type="error" showIcon message="画像加载失败" description={error} /> : null}
      <InlineFilterBar onReset={() => setKeyword("")}>
        <Form.Item label="商户/店铺">
          <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="输入商户或店铺编号" allowClear />
        </Form.Item>
      </InlineFilterBar>
      <LedgerTable rowKey="id" columns={columns} dataSource={filtered} loading={loading} pagination={{ pageSize: 10 }} />
      <DetailModal title="结算画像快照" open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected ? (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {selected.status === "UNCONFIRMED" ? <Alert type="warning" showIcon message="该画像含未确认商务规则，禁止用于真实资金执行" /> : null}
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="快照 ID">{selected.id}</Descriptions.Item>
              <Descriptions.Item label="版本">V{selected.version}</Descriptions.Item>
              <Descriptions.Item label="商户/店铺">{selected.merchantId} / {selected.shopId ?? "全部"}</Descriptions.Item>
              <Descriptions.Item label="账期">{cycleText(selected)}</Descriptions.Item>
              <Descriptions.Item label="返积分基数">{selected.rewardBaseType}</Descriptions.Item>
              <Descriptions.Item label="有效区间">{selected.effectiveFrom} ~ {selected.effectiveTo ?? "长期"}</Descriptions.Item>
              <Descriptions.Item label="线上/线下">{selected.onlineEnabled ? "线上" : ""} {selected.offlineEnabled ? "线下" : ""}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{selected.updatedAt}</Descriptions.Item>
            </Descriptions>
          </Space>
        ) : null}
      </DetailModal>
    </BackofficePage>
  );
}
