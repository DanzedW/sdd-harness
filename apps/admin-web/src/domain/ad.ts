// 广告领域 — Advertisement

import type { BaseRecord } from "./base";

export const PositionOptions = ["首页 Banner", "弹窗广告", "商品列表广告"] as const;
export type Position = (typeof PositionOptions)[number];

export const PositionColor: Record<Position, string> = {
  "首页 Banner": "blue",
  "弹窗广告": "purple",
  "商品列表广告": "cyan",
};

export const TargetTypeOptions = ["活动专题页", "商品详情页", "外部应用", "小程序"] as const;
export type TargetType = (typeof TargetTypeOptions)[number];

export const TargetTypeColor: Record<TargetType, string> = {
  "活动专题页": "green",
  "商品详情页": "geekblue",
  "外部应用": "orange",
  "小程序": "magenta",
};

export interface Advertisement extends BaseRecord {
  title: string;
  position: Position;
  targetType: TargetType;
  target: string;
  startAt: string;
  endAt: string;
}
