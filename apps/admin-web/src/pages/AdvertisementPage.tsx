import { PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminService } from "../services/adminService";
import {
  type Advertisement,
  type Position,
  PositionColor,
  PositionOptions,
  type TargetType,
  TargetTypeColor,
  TargetTypeOptions,
} from "../types";

export function AdvertisementPage() {
  const [records, setRecords] = useState<Advertisement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Advertisement | null>(null);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminService.advertisements({ keyword, status, page, pageSize });
      setRecords(result.items);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [keyword, page, pageSize, status]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const columns: ColumnsType<Advertisement> = useMemo(
    () => [
      { title: "广告标题", dataIndex: "title", width: 200 },
      {
        title: "广告位",
        dataIndex: "position",
        width: 140,
        render: (value: Position) => <Tag color={PositionColor[value] ?? "default"}>{value}</Tag>,
      },
      {
        title: "跳转类型",
        dataIndex: "targetType",
        width: 140,
        render: (value: TargetType) => <Tag color={TargetTypeColor[value] ?? "default"}>{value}</Tag>,
      },
      { title: "跳转目标", dataIndex: "target", width: 220, ellipsis: true },
      { title: "开始时间", dataIndex: "startAt", width: 120 },
      { title: "结束时间", dataIndex: "endAt", width: 120 },
      {
        title: "状态",
        dataIndex: "status",
        width: 90,
        render: (value: string) => {
          const colorMap: Record<string, string> = { 启用: "green", 停用: "default", 草稿: "blue" };
          return <Tag color={colorMap[value] ?? "default"}>{value}</Tag>;
        },
      },
      {
        title: "操作",
        width: 180,
        fixed: "right",
        render: (_, record) => (
          <Space>
            <Button
              type="link"
              onClick={() => {
                Modal.info({
                  title: "广告详情",
                  width: 640,
                  content: (
                    <div style={{ lineHeight: 2 }}>
                      <p><strong>标题：</strong>{record.title}</p>
                      <p><strong>广告位：</strong><Tag color={PositionColor[record.position]}>{record.position}</Tag></p>
                      <p><strong>跳转类型：</strong><Tag color={TargetTypeColor[record.targetType]}>{record.targetType}</Tag></p>
                      <p><strong>跳转目标：</strong>{record.target}</p>
                      <p><strong>开始时间：</strong>{record.startAt}</p>
                      <p><strong>结束时间：</strong>{record.endAt}</p>
                      <p><strong>状态：</strong><Tag color={record.status === "启用" ? "green" : record.status === "停用" ? "default" : "blue"}>{record.status}</Tag></p>
                      <p><strong>更新时间：</strong>{record.updatedAt}</p>
                    </div>
                  ),
                });
              }}
            >
              查看
            </Button>
            <Button
              type="link"
              onClick={() => {
                setEditing(record);
                form.setFieldsValue({
                  ...record,
                  startAt: record.startAt ? dayjs(record.startAt) : null,
                  endAt: record.endAt ? dayjs(record.endAt) : null,
                });
                setModalOpen(true);
              }}
            >
              编辑
            </Button>
            <Popconfirm
              title="确认删除？"
              description="删除会写入本地 Mock 数据，刷新后仍然生效。"
              okText="删除"
              cancelText="取消"
              onConfirm={async () => {
                await adminService.removeAdvertisement(record.id);
                message.success("已从本地 Mock 数据中删除");
                await loadData();
              }}
            >
              <Button type="link" danger>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [form, loadData],
  );

  const handleSave = async () => {
    const values = await form.validateFields();
    const data = {
      ...values,
      startAt: values.startAt ? dayjs(values.startAt).format("YYYY-MM-DD") : "",
      endAt: values.endAt ? dayjs(values.endAt).format("YYYY-MM-DD") : "",
    };
    if (editing) {
      await adminService.saveAdvertisement({ ...editing, ...data });
      message.success("已写入本地 Mock 数据");
    } else {
      const item: Advertisement = {
        id: "MOCK-" + Date.now(),
        status: "启用",
        updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
        ...data,
      };
      await adminService.saveAdvertisement(item);
      message.success("已写入本地 Mock 数据");
    }
    setModalOpen(false);
    await loadData();
  };

  return (
    <section className="page-card">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>广告管理</Typography.Title>
          <Typography.Paragraph type="secondary">
            覆盖首页 Banner、弹窗广告和商品列表广告的 Mock 配置，支持活动专题页、商品详情页、外部应用、小程序等跳转类型。
          </Typography.Paragraph>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            form.resetFields();
            setModalOpen(true);
          }}
        >
          新增
        </Button>
      </div>

      <div className="toolbar">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索广告标题、跳转目标"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onPressEnter={() => setPage(1)}
        />
        <Select
          allowClear
          placeholder="状态"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={["启用", "停用", "草稿"].map((item) => ({ label: item, value: item }))}
          style={{ width: 120 }}
        />
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            setKeyword("");
            setStatus(undefined);
            setPage(1);
          }}
        >
          重置
        </Button>
      </div>

      <Table<Advertisement>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={records}
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (value) => "共 " + value + " 条 Mock 数据",
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          },
        }}
      />

      <Modal
        title={editing ? "编辑广告" : "新增广告"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        destroyOnClose
        width={580}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="广告标题" name="title" rules={[{ required: true, message: "请输入广告标题" }]}>
            <Input placeholder="请输入广告标题" />
          </Form.Item>
          <Form.Item label="广告位" name="position" rules={[{ required: true, message: "请选择广告位" }]}>
            <Select
              options={PositionOptions.map((item) => ({ label: item, value: item }))}
              placeholder="请选择广告位"
            />
          </Form.Item>
          <Form.Item label="跳转类型" name="targetType" rules={[{ required: true, message: "请选择跳转类型" }]}>
            <Select
              options={TargetTypeOptions.map((item) => ({ label: item, value: item }))}
              placeholder="请选择跳转类型"
            />
          </Form.Item>
          <Form.Item label="跳转目标" name="target" rules={[{ required: true, message: "请输入跳转目标" }]}>
            <Input placeholder="请输入 URL、页面路径或小程序路径" />
          </Form.Item>
          <Form.Item label="开始时间" name="startAt">
            <DatePicker style={{ width: "100%" }} placeholder="选择开始时间" />
          </Form.Item>
          <Form.Item label="结束时间" name="endAt">
            <DatePicker style={{ width: "100%" }} placeholder="选择结束时间" />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
}
