import type { ColumnsType } from "antd/es/table";
import { CrudTablePage } from "../components/CrudTablePage";
import { adminService } from "../services/adminService";
import type { FieldConfig, User } from "../types";

const columns: ColumnsType<User> = [
  { title: "姓名", dataIndex: "name", width: 120 },
  { title: "手机号", dataIndex: "phone", width: 150 },
  { title: "项目", dataIndex: "project", width: 140 },
  { title: "会员等级", dataIndex: "level", width: 120 },
  { title: "注册时间", dataIndex: "registeredAt", width: 130 },
];

const fields: FieldConfig<User>[] = [
  { key: "name", label: "姓名", required: true },
  { key: "phone", label: "手机号", required: true },
  { key: "project", label: "项目", required: true },
  { key: "level", label: "会员等级", type: "select", options: ["普通会员", "黄金会员", "企业会员"], required: true },
  { key: "registeredAt", label: "注册时间" },
];

export function UserPage() {
  return (
    <CrudTablePage<User>
      title="用户管理"
      description="用于运营人员筛选、搜索和查看用户基础信息。"
      searchPlaceholder="搜索姓名、手机号、项目"
      columns={columns}
      fields={fields}
      fetcher={adminService.users}
      saver={adminService.saveUser}
      remover={adminService.removeUser}
    />
  );
}
