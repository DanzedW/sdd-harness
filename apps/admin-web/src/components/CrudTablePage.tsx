import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Tag, message } from "antd";
import type { FormInstance } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { BaseRecord, FieldConfig, PageResult, QueryParams } from "../types";
import { BackofficePage } from "./backoffice/BackofficePage";
import { InlineFilterBar } from "./backoffice/InlineFilterBar";
import { LedgerTable } from "./backoffice/LedgerTable";

const statusColors: Record<string, string> = {
  启用: "green",
  停用: "default",
  草稿: "blue",
  待审核: "orange",
  已完成: "green",
  处理中: "processing",
  异常: "red",
  上架: "green",
  下架: "red",
};

export function StatusTag({ status }: { status: string }) {
  return <Tag color={statusColors[status] ?? "default"}>{status}</Tag>;
}

interface CrudTablePageProps<T extends BaseRecord> {
  title: string;
  description: string;
  searchPlaceholder: string;
  columns: ColumnsType<T>;
  fields: FieldConfig<T>[];
  fetcher: (params: QueryParams) => Promise<PageResult<T>>;
  saver: (record: T) => Promise<T>;
  remover: (id: string) => Promise<void>;
  renderDetail?: (record: T) => React.ReactNode;
  renderFormFields?: (form: FormInstance, record: T | null) => React.ReactNode;
  extraActions?: ColumnsType<T>[number];
}

export function CrudTablePage<T extends BaseRecord>({
  title,
  description,
  searchPlaceholder,
  columns,
  fields,
  fetcher,
  saver,
  remover,
  renderDetail,
  renderFormFields,
  extraActions,
}: CrudTablePageProps<T>) {
  const [records, setRecords] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetcher({ keyword, status, page, pageSize });
      setRecords(result.items);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [fetcher, keyword, page, pageSize, status]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const tableColumns = useMemo<ColumnsType<T>>(
    () => [
      ...columns,
      {
        title: "状态",
        dataIndex: "status",
        width: 100,
        render: (value: string) => <StatusTag status={value} />,
      },
      {
        title: "更新时间",
        dataIndex: "updatedAt",
        width: 170,
      },
      {
        title: "操作",
        width: extraActions ? 240 : 150,
        fixed: "right",
        render: (_, record) => (
          <Space>
            {extraActions?.render
              ? (extraActions.render(_, record, 0) as React.ReactNode)
              : null}
            <Button
              type="link"
              onClick={() => {
                if (renderDetail) {
                  Modal.info({
                    title: title + "详情",
                    width: 720,
                    content: renderDetail(record),
                  });
                } else {
                  Modal.info({
                    title: title + "详情",
                    width: 720,
                    content: <pre className="record-json">{JSON.stringify(record, null, 2)}</pre>,
                  });
                }
              }}
            >
              查看
            </Button>
            <Button
              type="link"
              onClick={() => {
                setEditing(record);
                form.setFieldsValue(record);
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
                await remover(record.id);
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
    [columns, form, loadData, remover, title, renderDetail, extraActions],
  );

  return (
    <BackofficePage
      breadcrumbs={[title, title]}
      title={title}
      description={description}
      actions={
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
      }
    >

      <InlineFilterBar
        onSearch={() => setPage(1)}
        onReset={() => {
          setKeyword("");
          setStatus(undefined);
          setPage(1);
        }}
      >
        <Form.Item label="关键词">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={searchPlaceholder}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onPressEnter={() => setPage(1)}
            style={{ width: 260 }}
          />
        </Form.Item>
        <Form.Item label="状态">
          <Select
            allowClear
            placeholder="请选择"
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={["启用", "停用", "草稿", "待审核", "已完成", "处理中", "异常"].map((item) => ({
              label: item,
              value: item,
            }))}
            style={{ width: 140 }}
          />
        </Form.Item>
      </InlineFilterBar>

      <LedgerTable<T>
        rowKey="id"
        loading={loading}
        columns={tableColumns}
        dataSource={records}
        scroll={{ x: 1000 }}
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
        title={editing ? "编辑" + title : "新增" + title}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={async () => {
          const values = form.getFieldsValue();
          if (editing) {
            await saver({ ...editing, ...values });
            message.success("已写入本地 Mock 数据");
          } else {
            const item = {
              id: "MOCK-" + Date.now(),
              status: "启用",
              updatedAt: "刚刚",
              ...values,
            } as unknown as T;
            // TODO: 消除 as 断言，收窄泛型约束或用 Partial<T> + 字段补齐
            await saver(item);
            message.success("已写入本地 Mock 数据");
          }
          setModalOpen(false);
          await loadData();
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {renderFormFields
            ? renderFormFields(form, editing)
            : fields.map((field) => (
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
        </Form>
      </Modal>
    </BackofficePage>
  );
}
