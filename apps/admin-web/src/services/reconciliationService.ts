// services/reconciliationService.ts — 对账 Mock Service

import type { ReconciliationRecord, PageResult, QueryParams } from "../domain";
import { reconciliationRecords } from "../mocks/data-reconciliation";
import { createRepository } from "./mockRepository";

const reconRepo = createRepository<ReconciliationRecord>(
  "digital-life-admin:reconciliation",
  reconciliationRecords,
  ["reconId", "businessReference"]
);

export const reconciliationService = {
  queryRecords: (params?: QueryParams): Promise<PageResult<ReconciliationRecord>> =>
    reconRepo.query(params),
};
