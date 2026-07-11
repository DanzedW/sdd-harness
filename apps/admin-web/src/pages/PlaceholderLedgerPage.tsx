import { Empty, Tag, Typography } from "antd";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import { LedgerTable } from "../components/backoffice/LedgerTable";

interface PlaceholderLedgerPageProps {
  moduleName: string;
  parentName: string;
  source: string;
  phase: "一期" | "二期" | "后续";
  scope: string;
}

export function PlaceholderLedgerPage({
  moduleName,
  parentName,
  source,
  phase,
  scope,
}: PlaceholderLedgerPageProps) {
  return (
    <BackofficePage
      breadcrumbs={[parentName, moduleName]}
      title={moduleName}
      description="该页面先按供应链后台台账结构预留入口，后续接入 Mock 数据和操作。"
      actions={<Tag color={phase === "一期" ? "blue" : "default"}>{phase}</Tag>}
    >
      <LedgerTable
        rowKey="id"
        columns={[
          { title: "模块", dataIndex: "module", width: 160 },
          { title: "来源需求", dataIndex: "source", width: 220 },
          { title: "当前阶段", dataIndex: "phase", width: 120 },
          { title: "后续实现范围", dataIndex: "scope" },
        ]}
        dataSource={[
          {
            id: moduleName,
            module: moduleName,
            source,
            phase,
            scope,
          },
        ]}
        pagination={false}
      />
      <div style={{ padding: "24px 0" }}>
        <Empty
          description={
            <Typography.Text type="secondary">
              当前只提供本地 Mock 入口，不编造功能清单以外的合同承诺。
            </Typography.Text>
          }
        />
      </div>
    </BackofficePage>
  );
}
