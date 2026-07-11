// 管理领域 — AdminAccount / Role / SystemMenu

import type { BaseRecord } from "./base";

export interface SystemMenu extends BaseRecord {
  name: string;
  path: string;
  permission: string;
  sort: number;
}

export interface Role extends BaseRecord {
  name: string;
  permissions: string[];
  userCount: number;
}

export interface AdminAccount extends BaseRecord {
  name: string;
  account: string;
  password?: string;
  role: string;
  phone: string;
}
