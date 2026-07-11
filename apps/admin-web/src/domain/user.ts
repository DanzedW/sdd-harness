// 用户领域 — User

import type { BaseRecord } from "./base";

export interface User extends BaseRecord {
  name: string;
  phone: string;
  project: string;
  level: "普通会员" | "黄金会员" | "企业会员";
  registeredAt: string;
}
