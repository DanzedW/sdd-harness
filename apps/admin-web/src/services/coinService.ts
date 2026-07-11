// services/coinService.ts — 积分 Mock Service

import type { CoinRecord, PageResult, QueryParams } from "../domain";
import { coinRecords } from "../mocks/data-coin";
import { createRepository } from "./mockRepository";

const coinRepo = createRepository<CoinRecord>(
  "digital-life-admin:coin-records",
  coinRecords,
  ["recordId", "userId", "source"]
);

export const coinService = {
  queryRecords: (params?: QueryParams): Promise<PageResult<CoinRecord>> =>
    coinRepo.query(params),

  getUserBalance: async (userId: string): Promise<number> => {
    const all = await coinRepo.all();
    const userRecords = all.filter((r) => r.userId === userId);
    if (userRecords.length === 0) return 0;
    return userRecords.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0].balanceAfter;
  },

  getRecordsByUserId: async (userId: string): Promise<CoinRecord[]> => {
    const all = await coinRepo.all();
    return all
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};
