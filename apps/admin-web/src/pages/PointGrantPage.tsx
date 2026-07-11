import { Alert, Button, Space, Tag, Upload, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";
import { BackofficePage } from "../components/backoffice/BackofficePage";
import { LedgerTable } from "../components/backoffice/LedgerTable";
import type { PointGrantBatch, PointGrantDetail } from "../domain";
import { v03MockServices } from "../services/v03MockServices";
import { financialStatusColor, formatCents } from "./v03Ui";

export function PointGrantPage() {
  const [batches, setBatches] = useState<PointGrantBatch[]>([]);
  const [details, setDetails] = useState<PointGrantDetail[]>([]);
  const [currentBatch, setCurrentBatch] = useState<PointGrantBatch | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBatches(await v03MockServices.pointGrantAdminService.listBatches());
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const showBatch = async (batch: PointGrantBatch) => {
    setCurrentBatch(batch);
    setDetails(await v03MockServices.pointGrantAdminService.listDetails(batch.id));
  };

  const preview = async () => {
    if (!fileName) return;
    try {
      const result = await v03MockServices.pointGrantAdminService.previewDemoExcel(fileName, `ui-upload:${fileName}`);
      setCurrentBatch(result.batch);
      setDetails(result.details);
      message.success("Excel Mock 预校验完成");
      await load();
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const approve = async () => {
    if (!currentBatch) return;
    const batch = await v03MockServices.pointGrantAdminService.approve(currentBatch.id, "demo-operator");
    setCurrentBatch(batch);
    message.success("批次已审批，尚未执行资金变更");
    await load();
  };

  const execute = async () => {
    if (!currentBatch) return;
    try {
      const result = await v03MockServices.pointGrantAdminService.execute(currentBatch.id, `ui-execute:${currentBatch.id}`);
      setCurrentBatch(result.batch);
      setDetails(result.details);
      message.success("批次已幂等执行，成功与失败明细已刷新");
      await load();
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const batchColumns: ColumnsType<PointGrantBatch> = [
    { title: "批次", dataIndex: "batchNo", width: 150 },
    { title: "文件", dataIndex: "fileName", width: 160 },
    { title: "发放机构", dataIndex: "sourceOrganizationName", width: 150 },
    { title: "总行数", dataIndex: "totalCount", width: 80 },
    { title: "有效", dataIndex: "validCount", width: 70 },
    { title: "失败", dataIndex: "failedCount", width: 70 },
    { title: "积分数", dataIndex: "totalPoints", width: 90 },
    { title: "状态", dataIndex: "status", width: 120, render: (value: string) => <Tag color={financialStatusColor(value)}>{value}</Tag> },
    { title: "幂等键", dataIndex: "idempotentKey", ellipsis: true },
    { title: "操作", fixed: "right", width: 80, render: (_, record) => <Button type="link" size="small" onClick={() => showBatch(record)}>明细</Button> },
  ];

  const detailColumns: ColumnsType<PointGrantDetail> = [
    { title: "Excel 行", dataIndex: "rowNumber", width: 80 },
    { title: "姓名", dataIndex: "recipientName", width: 90 },
    { title: "手机号", dataIndex: "phoneMasked", width: 120 },
    { title: "积分", dataIndex: "pointAmount", width: 80 },
    { title: "现金等值", dataIndex: "cashEquivalent", width: 100, render: formatCents },
    { title: "用户", dataIndex: "userId", width: 90, render: (value: string | null) => value ?? "待认领" },
    { title: "结果", dataIndex: "status", width: 120, render: (value: string) => <Tag color={financialStatusColor(value)}>{value}</Tag> },
    { title: "失败原因", dataIndex: "failureReason", ellipsis: true, render: (value: string | null) => value ?? "-" },
  ];

  return (
    <BackofficePage
      breadcrumbs={["统一结算 V0.3", "积分批量发放"]}
      title="Excel 积分批量发放"
      description="上传文件仅作前端 Mock：预校验 → 预览 → 人工审批 → 幂等执行 → 已注册入账 / 未注册待认领。"
      actions={
        <Space>
          <Upload accept=".xlsx,.xls" maxCount={1} showUploadList={false} beforeUpload={(file) => { setFileName(file.name); return false; }}>
            <Button icon={<InboxOutlined />}>选择 Excel</Button>
          </Upload>
          <Button type="primary" disabled={!fileName} onClick={preview}>预校验</Button>
        </Space>
      }
    >
      {error ? <Alert type="error" showIcon message="批次加载失败" description={error} /> : null}
      {fileName ? <Alert type="info" showIcon message={`已选择：${fileName}`} description="Mock 不上传真实文件；预校验使用内置的成功、待认领和错误行场景。" /> : null}
      <LedgerTable rowKey="id" columns={batchColumns} dataSource={batches} loading={loading} pagination={{ pageSize: 8 }} scroll={{ x: 1200 }} />
      {currentBatch ? (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Alert
            type={currentBatch.status === "PARTIAL" ? "warning" : "info"}
            showIcon
            message={`当前批次 ${currentBatch.batchNo} · ${currentBatch.status}`}
            description={`审批人：${currentBatch.approvedBy ?? "未审批"}；执行时间：${currentBatch.executedAt ?? "未执行"}`}
            action={
              <Space>
                <Button disabled={Boolean(currentBatch.approvedBy) || Boolean(currentBatch.executedAt)} onClick={approve}>审批</Button>
                <Button type="primary" disabled={!currentBatch.approvedBy || Boolean(currentBatch.executedAt)} onClick={execute}>幂等执行</Button>
              </Space>
            }
          />
          <LedgerTable rowKey="id" columns={detailColumns} dataSource={details} pagination={false} />
        </Space>
      ) : null}
    </BackofficePage>
  );
}
