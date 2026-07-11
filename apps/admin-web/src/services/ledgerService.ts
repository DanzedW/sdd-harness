// services/ledgerService.ts — 记账分录 Mock Service

import type { LedgerEntry, PageResult, QueryParams } from "../domain";
import { ledgerEntries } from "../mocks/data-ledger";
import { createRepository } from "./mockRepository";

const ledgerRepo = createRepository<LedgerEntry>(
  "digital-life-admin:ledger-entries",
  ledgerEntries,
  ["entryId", "orderId", "description"]
);

export const ledgerService = {
  queryEntries: (params?: QueryParams): Promise<PageResult<LedgerEntry>> =>
    ledgerRepo.query(params),
};
