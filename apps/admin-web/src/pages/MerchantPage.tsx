import { useState } from "react";
import { Button, Descriptions, Divider, Form, Image, Input, message, Modal, Select, Space, Tag, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { FormInstance, UploadProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CrudTablePage, StatusTag } from "../components/CrudTablePage";
import { adminService } from "../services/adminService";
import type { FieldConfig, Merchant } from "../types";

// 审核状态颜色映射
const auditStatusColorMap: Record<string, string> = {
  "待审核": "orange",
  "审核通过": "green",
  "审核驳回": "red",
};

// 商户等级颜色映射
const levelColorMap: Record<string, string> = {
  "普通商户": "default",
  "金牌商户": "gold",
  "战略合作": "red",
};

const columns: ColumnsType<Merchant> = [
  { title: "商户名称", dataIndex: "name", width: 140 },
  { title: "商户简称", dataIndex: "shortName", width: 100 },
  { title: "业态", dataIndex: "businessType", width: 120 },
  {
    title: "商户等级",
    dataIndex: "merchantLevel",
    width: 110,
    render: (value?: string) => {
      if (!value) return "-";
      return <Tag color={levelColorMap[value] ?? "default"}>{value}</Tag>;
    },
  },
  { title: "联系人", dataIndex: "contact", width: 100 },
  { title: "电话", dataIndex: "phone", width: 130 },
  { title: "所在城市", dataIndex: "city", width: 100 },
  {
    title: "审核状态",
    dataIndex: "auditStatus",
    width: 100,
    render: (value?: string) => {
      if (!value) return "-";
      return <Tag color={auditStatusColorMap[value] ?? "default"}>{value}</Tag>;
    },
  },
];

const fields: FieldConfig<Merchant>[] = [
  { key: "name", label: "商户名称", required: true },
  { key: "shortName", label: "商户简称" },
  { key: "businessType", label: "业态", required: true },
  { key: "contact", label: "联系人", required: true },
  { key: "phone", label: "电话", required: true },
];

function MerchantFormFields({ form, record }: { form: FormInstance; record: Merchant | null }) {
  const [logoUrl, setLogoUrl] = useState<string>(record?.logo ?? "");

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        message.error("图片大小不能超过 2MB");
        return Upload.LIST_IGNORE;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setLogoUrl(dataUrl);
        form.setFieldValue("logo", dataUrl);
      };
      reader.onerror = () => {
        message.error("图片加载失败，请重新选择");
      };
      reader.readAsDataURL(file);
      return false;
    },
    maxCount: 1,
    showUploadList: false,
  };

  return (
    <>
      {/* 基础信息 */}
      {fields.map((field) => (
        <Form.Item
          key={String(field.key)}
          label={field.label}
          name={String(field.key)}
          rules={field.required ? [{ required: true, message: "请输入" + field.label }] : undefined}
        >
          {field.type === "select" ? (
            <Select options={field.options?.map((item) => ({ label: item, value: item })) ?? []} />
          ) : (
            <Input type={field.type === "number" ? "number" : "text"} />
          )}
        </Form.Item>
      ))}

      <Divider orientation="left" orientationMargin={0}>资质信息</Divider>
      <Form.Item label="主体类型" name="subjectType">
        <Select
          allowClear
          placeholder="请选择主体类型"
          options={["企业法人", "个体工商户", "事业单位"].map((item) => ({ label: item, value: item }))}
        />
      </Form.Item>
      <Form.Item label="法定代表人" name="legalPersonName">
        <Input placeholder="请输入法定代表人姓名" />
      </Form.Item>
      <Form.Item label="法人手机号" name="legalPersonPhone">
        <Input placeholder="请输入法定代表人手机号" />
      </Form.Item>
      <Form.Item label="证件号" name="certNo">
        <Input placeholder="请输入统一社会信用代码" />
      </Form.Item>

      <Divider orientation="left" orientationMargin={0}>地址信息</Divider>
      <Form.Item label="省份" name="province">
        <Input placeholder="请输入省份" />
      </Form.Item>
      <Form.Item label="所在城市" name="city">
        <Select
          allowClear
          placeholder="请选择城市"
          options={["杭州市", "宁波市", "温州市", "嘉兴市", "湖州市", "绍兴市", "金华市", "衢州市", "舟山市", "台州市", "丽水市"].map(
            (item) => ({ label: item, value: item }),
          )}
        />
      </Form.Item>
      <Form.Item label="区/县" name="district">
        <Input placeholder="请输入区/县" />
      </Form.Item>
      <Form.Item label="详细地址" name="address">
        <Input placeholder="请输入详细地址" />
      </Form.Item>
      <Form.Item label="经纬度" name="coordinate">
        <Input placeholder="经度,纬度（如 120.1552,30.2741）" />
      </Form.Item>

      <Divider orientation="left" orientationMargin={0}>经营信息</Divider>
      <Form.Item label="注册资本(分)" name="registeredCapital">
        <Input type="number" placeholder="单位：分" />
      </Form.Item>
      <Form.Item label="结算扣点(基点)" name="settlementRateBps">
        <Input type="number" placeholder="如 500 表示 5%" />
      </Form.Item>
      <Form.Item label="商品分类" name="productCategories">
        <Select
          mode="multiple"
          allowClear
          placeholder="请选择关联商品分类"
          options={["生鲜", "粮油调味", "乳品烘焙", "餐饮", "家政", "家电维修", "汽车保养", "社区零售", "缴费", "会员", "教育", "环保", "宠物", "医药", "健康", "物业", "生活服务"].map(
            (item) => ({ label: item, value: item }),
          )}
        />
      </Form.Item>

      <Divider orientation="left" orientationMargin={0}>展示信息</Divider>
      <Form.Item label="形象图" name="logo">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>上传形象图</Button>
          </Upload>
          {logoUrl && <Image src={logoUrl} width={60} height={60} style={{ borderRadius: 4, objectFit: "cover" }} />}
        </div>
      </Form.Item>
      <Form.Item label="商户介绍" name="description">
        <Input.TextArea rows={3} placeholder="请输入商户简介" />
      </Form.Item>
    </>
  );
}

function MerchantDetailPanel({ record }: { record: Merchant }) {
  const auditStatusColor = auditStatusColorMap[record.auditStatus ?? ""] ?? "default";
  const levelColor = levelColorMap[record.merchantLevel ?? ""] ?? "default";

  return (
    <>
      <Descriptions column={2} bordered size="small" style={{ marginTop: 16 }}>
        <Descriptions.Item label="商户名称" span={2}>
          {record.name}
        </Descriptions.Item>
        <Descriptions.Item label="商户简称">{record.shortName ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="业态">{record.businessType}</Descriptions.Item>
        <Descriptions.Item label="商户等级">
          {record.merchantLevel ? <Tag color={levelColor}>{record.merchantLevel}</Tag> : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="主体类型">{record.subjectType ?? "-"}</Descriptions.Item>
      </Descriptions>

      <Divider orientation="left" orientationMargin={0} style={{ fontSize: 13 }}>
        联系信息
      </Divider>
      <Descriptions column={2} bordered size="small">
        <Descriptions.Item label="联系人">{record.contact}</Descriptions.Item>
        <Descriptions.Item label="电话">{record.phone}</Descriptions.Item>
        <Descriptions.Item label="法定代表人">{record.legalPersonName ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="法人手机号">{record.legalPersonPhone ?? "-"}</Descriptions.Item>
      </Descriptions>

      <Divider orientation="left" orientationMargin={0} style={{ fontSize: 13 }}>
        资质信息
      </Divider>
      <Descriptions column={2} bordered size="small">
        <Descriptions.Item label="证件号" span={2}>
          {record.certNo ?? "-"}
        </Descriptions.Item>
        <Descriptions.Item label="证件正面">
          {record.certImageFront ? (
            <Image src={record.certImageFront} width={80} style={{ borderRadius: 4 }} />
          ) : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="证件反面">
          {record.certImageBack ? (
            <Image src={record.certImageBack} width={80} style={{ borderRadius: 4 }} />
          ) : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="营业执照" span={2}>
          {record.businessLicenseImage ? (
            <Image src={record.businessLicenseImage} width={80} style={{ borderRadius: 4 }} />
          ) : "-"}
        </Descriptions.Item>
      </Descriptions>

      <Divider orientation="left" orientationMargin={0} style={{ fontSize: 13 }}>
        地址信息
      </Divider>
      <Descriptions column={2} bordered size="small">
        <Descriptions.Item label="省份">{record.province ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="城市">{record.city ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="区/县">{record.district ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="经纬度">{record.coordinate ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="详细地址" span={2}>
          {record.address}
        </Descriptions.Item>
      </Descriptions>

      <Divider orientation="left" orientationMargin={0} style={{ fontSize: 13 }}>
        经营信息
      </Divider>
      <Descriptions column={2} bordered size="small">
        <Descriptions.Item label="入驻时间">{record.registeredAt ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="注册资本(分)">{record.registeredCapital?.toLocaleString() ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="结算扣点(基点)">{record.settlementRateBps != null ? record.settlementRateBps + " bps" : "-"}</Descriptions.Item>
        <Descriptions.Item label="关联分类" span={2}>
          {record.productCategories?.length ? record.productCategories.join("、") : "-"}
        </Descriptions.Item>
      </Descriptions>

      <Divider orientation="left" orientationMargin={0} style={{ fontSize: 13 }}>
        展示与状态
      </Divider>
      <Descriptions column={2} bordered size="small">
        <Descriptions.Item label="形象图" span={2}>
          {record.logo ? (
            <Image src={record.logo} width={80} height={80} style={{ borderRadius: 4, objectFit: "cover" }} />
          ) : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="商户介绍" span={2}>
          {record.description ?? "-"}
        </Descriptions.Item>
        <Descriptions.Item label="审核状态">
          {record.auditStatus ? <Tag color={auditStatusColor}>{record.auditStatus}</Tag> : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="驳回原因">{record.rejectReason ?? "-"}</Descriptions.Item>
        <Descriptions.Item label="基础状态">
          <StatusTag status={record.status} />
        </Descriptions.Item>
        <Descriptions.Item label="更新时间">{record.updatedAt}</Descriptions.Item>
      </Descriptions>
    </>
  );
}

export function MerchantPage() {
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditing, setAuditing] = useState<Merchant | null>(null);
  const [auditAction, setAuditAction] = useState<"审核通过" | "审核驳回">("审核通过");
  const [rejectReason, setRejectReason] = useState("");

  const showAuditModal = (record: Merchant, action: "审核通过" | "审核驳回") => {
    setAuditing(record);
    setAuditAction(action);
    setRejectReason("");
    setAuditModalOpen(true);
  };

  const confirmAudit = async () => {
    if (!auditing) return;
    try {
      await adminService.auditMerchant(auditing.id, auditAction, auditAction === "审核驳回" ? rejectReason : undefined);
      message.success(`商户「${auditing.name}」已${auditAction}`);
      setAuditModalOpen(false);
      setAuditing(null);
    } catch {
      message.error("审核操作失败");
    }
  };

  // 审核操作列（仅对「待审核」状态显示）
  const extraActions: ColumnsType<Merchant>[number] = {
    title: "",
    render: (_, record) => (
      <Space>
        {record.auditStatus === "待审核" && (
          <>
            <Button type="link" style={{ color: "green" }} size="small" onClick={() => showAuditModal(record, "审核通过")}>
              通过
            </Button>
            <Button type="link" danger size="small" onClick={() => showAuditModal(record, "审核驳回")}>
              驳回
            </Button>
          </>
        )}
      </Space>
    ),
  };

  return (
    <>
      <CrudTablePage<Merchant>
        title="商户管理"
        description="模拟商户信息录入、资质审核和基础资料维护。"
        searchPlaceholder="搜索商户名称、证件号、联系人、电话"
        columns={columns}
        fields={fields}
        fetcher={adminService.merchants}
        saver={adminService.saveMerchant}
        remover={adminService.removeMerchant}
        renderDetail={(record) => <MerchantDetailPanel record={record} />}
        renderFormFields={(form, record) => <MerchantFormFields form={form} record={record} />}
        extraActions={extraActions}
      />

      <Modal
        title={`审核商户 — ${auditing?.name ?? ""}`}
        open={auditModalOpen}
        onOk={confirmAudit}
        onCancel={() => setAuditModalOpen(false)}
        okText={auditAction === "审核通过" ? "通过" : "驳回"}
        okButtonProps={{ danger: auditAction === "审核驳回" }}
      >
        <p style={{ marginBottom: 12 }}>
          确定将商户 <strong>{auditing?.name}</strong> 审核状态设为{" "}
          <Tag color={auditAction === "审核通过" ? "green" : "red"}>{auditAction}</Tag>？
        </p>
        {auditAction === "审核驳回" && (
          <Form.Item label="驳回原因" required>
            <Input.TextArea
              rows={3}
              placeholder="请输入驳回原因，商户可在后台查看"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </Form.Item>
        )}
      </Modal>
    </>
  );
}
