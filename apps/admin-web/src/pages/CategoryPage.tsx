import {
  FolderOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
  Tooltip,
  Tree,
  Typography,
  message,
} from "antd";
import type { DataNode } from "antd/es/tree";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminService } from "../services/adminService";
import type { Category } from "../types";

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

const levelColors: Record<string, string> = {
  一级: "blue",
  二级: "purple",
  三级: "cyan",
};

function StatusTag({ status }: { status: string }) {
  return <Tag color={statusColors[status] ?? "default"}>{status}</Tag>;
}

/** 将扁平分类列表转换为树节点 */
function buildTreeData(categories: Category[]): DataNode[] {
  const sorted = [...categories].sort((a, b) => a.sort - b.sort);
  const roots = sorted.filter((c) => !c.parentId);

  function toNode(cat: Category): DataNode {
    const children = sorted.filter((c) => c.parentId === cat.id);
    return {
      key: cat.id,
      title: (
        <Space size="small" style={{ flexWrap: "wrap" }}>
          <span style={{ fontWeight: 500 }}>{cat.name}</span>
          <Tag color={levelColors[cat.level] ?? "default"} style={{ marginRight: 0 }}>
            {cat.level}
          </Tag>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            排序：{cat.sort}
          </Typography.Text>
          <StatusTag status={cat.status} />
        </Space>
      ),
      icon: cat.level === "一级" ? <FolderOutlined /> : undefined,
      isLeaf: children.length === 0,
      children: children.length > 0 ? children.map(toNode) : undefined,
    };
  }

  return roots.map(toNode);
}

/** 从扁平列表中获取某个分类的所有子节点 ID（含自身） */
function getDescendantIds(categories: Category[], id: string): string[] {
  const result: string[] = [id];
  const children = categories.filter((c) => c.parentId === id);
  for (const child of children) {
    result.push(...getDescendantIds(categories, child.id));
  }
  return result;
}

/** 自动推算层级 */
function inferLevel(parentId: string | null, categoryMap: Map<string, Category>): "一级" | "二级" | "三级" {
  if (!parentId) return "一级";
  const parent = categoryMap.get(parentId);
  if (!parent) return "二级";
  if (parent.level === "一级") return "二级";
  if (parent.level === "二级") return "三级";
  return "三级";
}

/** 检查是否可以添加子分类 */
function canAddChild(level: "一级" | "二级" | "三级"): boolean {
  return level !== "三级";
}

export function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const all = await adminService.getAllCategories();
      setCategories(all);
      // 默认展开所有节点
      setExpandedKeys(all.filter((c) => !c.parentId).map((c) => c.id));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // 搜索过滤
  const filteredCategories = useMemo(() => {
    if (!searchText.trim()) return categories;
    const kw = searchText.trim().toLowerCase();
    const matched = new Set<string>();
    // 收集匹配的节点及其所有祖先
    const collect = (cats: Category[]) => {
      for (const c of cats) {
        if (c.name.toLowerCase().includes(kw)) {
          // 添加自身及所有祖先
          let current: Category | undefined = c;
          while (current) {
            matched.add(current.id);
            current = current.parentId ? categoryMap.get(current.parentId) : undefined;
          }
        }
        collect(cats.filter((cc) => cc.parentId === c.id));
      }
    };
    collect(categories.filter((c) => !c.parentId));
    return categories.filter((c) => matched.has(c.id));
  }, [categories, searchText, categoryMap]);

  const treeData = useMemo(() => buildTreeData(filteredCategories), [filteredCategories]);

  // 搜索时自动展开
  useEffect(() => {
    if (searchText.trim()) {
      setExpandedKeys(filteredCategories.filter((c) => !c.parentId).map((c) => c.id));
      setAutoExpandParent(true);
    }
  }, [searchText, filteredCategories]);

  const openAddModal = (parentCat: Category | null) => {
    setEditing(null);
    setParentId(parentCat?.id ?? null);
    form.resetFields();
    if (parentCat) {
      form.setFieldsValue({ parentId: parentCat.id });
    }
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditing(cat);
    setParentId(cat.parentId);
    form.setFieldsValue(cat);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = form.getFieldsValue();
    const parent = values.parentId ? categoryMap.get(values.parentId) : null;
    const level = inferLevel(values.parentId ?? null, categoryMap);

    if (editing) {
      const updated = {
        ...editing,
        ...values,
        level,
        parentName: parent?.name ?? "",
        updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      } as Category;
      await adminService.saveCategory(updated);
      message.success("分类已更新");
    } else {
      const item = {
        id: "C" + Date.now(),
        name: values.name,
        parentId: values.parentId ?? null,
        parentName: parent?.name ?? "",
        level,
        sort: values.sort ?? 0,
        status: values.status ?? "启用",
        updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      } as Category;
      await adminService.saveCategory(item);
      message.success("分类已新增");
    }
    setModalOpen(false);
    await loadData();
  };

  const handleDelete = async (cat: Category) => {
    // 检查是否有子分类
    const hasChildren = categories.some((c) => c.parentId === cat.id);
    if (hasChildren) {
      message.warning("请先删除子分类");
      return;
    }
    // 检查是否有商品使用该分类
    const productCount = await adminService.getCategoryProductCount(cat.id);
    if (productCount > 0) {
      message.warning(`该分类下有 ${productCount} 个商品，请先移除`);
      return;
    }
    await adminService.removeCategory(cat.id);
    message.success("分类已删除");
    await loadData();
  };

  return (
    <section className="page-card">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>分类管理</Typography.Title>
          <Typography.Paragraph type="secondary">
            树形结构展示一级→二级→三级分类的层级关系，支持搜索、新增、编辑、删除。
          </Typography.Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openAddModal(null)}>
          新增一级分类
        </Button>
      </div>

      <div className="toolbar">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索分类名称"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 280 }}
        />
      </div>

      <div className="category-tree-container">
        {treeData.length === 0 && !loading ? (
          <Empty description="暂无分类数据" />
        ) : (
          <Tree
            showLine
            showIcon
            treeData={treeData}
            expandedKeys={expandedKeys}
            selectedKeys={selectedKeys}
            autoExpandParent={autoExpandParent}
            onExpand={(keys) => {
              setExpandedKeys(keys);
              setAutoExpandParent(false);
            }}
            onSelect={(keys) => setSelectedKeys(keys)}
            titleRender={(node) => {
              const cat = categories.find((c) => c.id === node.key);
              if (!cat) return node.title as React.ReactNode;
              return (
                <div
                  className="tree-node-wrapper"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "4px 0",
                    width: "100%",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {node.title as React.ReactNode}
                  </div>
                  <Space size="small" onClick={(e) => e.stopPropagation()}>
                    {canAddChild(cat.level) && (
                      <Tooltip title={`添加${cat.level === "一级" ? "二级" : "三级"}子分类`}>
                        <Button
                          type="link"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => openAddModal(cat)}
                        />
                      </Tooltip>
                    )}
                    <Button type="link" size="small" onClick={() => openEditModal(cat)}>
                      编辑
                    </Button>
                    <Popconfirm
                      title="确认删除？"
                      description={
                        categories.some((c) => c.parentId === cat.id)
                          ? "该分类下有子分类，请先删除子分类"
                          : "删除会写入本地 Mock 数据，刷新后仍然生效。"
                      }
                      okText="删除"
                      cancelText="取消"
                      onConfirm={() => handleDelete(cat)}
                    >
                      <Button type="link" size="small" danger>
                        删除
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>
              );
            }}
            style={{ padding: "8px 0" }}
          />
        )}
      </div>

      <Modal
        title={editing ? "编辑分类" : parentId ? "新增子分类" : "新增一级分类"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" initialValues={{ status: "启用", sort: 0 }}>
          <Form.Item label="分类名称" name="name" rules={[{ required: true, message: "请输入分类名称" }]}>
            <Input placeholder="请输入分类名称" />
          </Form.Item>

          <Form.Item label="上级分类" name="parentId">
            <Select
              allowClear
              placeholder="不选则为一级分类"
              showSearch
              optionFilterProp="label"
              options={categories
                .filter((c) => {
                  // 编辑模式：不能选自己及其子节点
                  if (editing) {
                    const excludeIds = getDescendantIds(categories, editing.id);
                    return !excludeIds.includes(c.id);
                  }
                  return true;
                })
                .map((c) => ({
                  label: `${c.name}（${c.level}）`,
                  value: c.id,
                }))}
              onChange={(val) => {
                // 自动更新层级显示
                const level = inferLevel(val ?? null, categoryMap);
                form.setFieldsValue({ level });
              }}
            />
          </Form.Item>

          <Form.Item label="层级" name="level">
            <Input disabled />
          </Form.Item>

          <Form.Item label="排序" name="sort">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="状态" name="status">
            <Select
              options={[
                { label: "启用", value: "启用" },
                { label: "停用", value: "停用" },
                { label: "草稿", value: "草稿" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
}
