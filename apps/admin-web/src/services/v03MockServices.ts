import type { CouponFundingBatch, MerchantSettlementProfile } from "../domain";
import {
  merchantSettlementProfiles,
  v03CouponFundingBatches,
  v03FundingPools,
  v03SplitInstructions,
} from "../mocks/data-v03";
import { createFundingPoolService } from "./fundingPoolService";
import { createPointGrantService, hashPhoneForMock } from "./pointGrantService";
import { createSplitService } from "./splitService";

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function createV03MockServices() {
  const fundingPoolService = createFundingPoolService({ pools: v03FundingPools });
  const registeredPhone = "138" + "0000" + "0001";
  const pendingPhone = "139" + "0000" + "0002";
  const pointGrantService = createPointGrantService({
    fundingPoolService,
    registeredUsers: [{ phoneHash: hashPhoneForMock(registeredPhone), userId: "U001" }],
  });
  const splitService = createSplitService({ splits: v03SplitInstructions });

  const seedPreview = pointGrantService.previewBatch({
    fundingPoolId: "pool-point-main",
    sourceOrganizationId: "ORG-GOV-001",
    sourceOrganizationName: "示例积分发放机构",
    fileName: "seed-point-grant.xlsx",
    idempotentKey: "seed-upload:point-grant",
    rows: [
      { recipientName: "王*", phone: registeredPhone, pointAmount: 500, cashEquivalent: 500 },
      { recipientName: "李*", phone: pendingPhone, pointAmount: 300, cashEquivalent: 300 },
      { recipientName: "格式错误", phone: "123", pointAmount: 100, cashEquivalent: 100 },
    ],
  });
  pointGrantService.approveBatch(seedPreview.batch.id, "seed-operator");
  pointGrantService.executeBatch(seedPreview.batch.id, "seed-execute:point-grant");

  return {
    settlementProfileService: {
      list: async (): Promise<MerchantSettlementProfile[]> => clone(merchantSettlementProfiles),
    },
    splitLedgerService: {
      list: async () => splitService.listSplits(),
      listAudits: async () => splitService.listAuditRecords(),
      listReconciliations: async () => splitService.listReconciliations(),
      retry: async (input: Parameters<typeof splitService.retry>[0]) => splitService.retry(input),
      reverse: async (input: Parameters<typeof splitService.reverse>[0]) => splitService.reverse(input),
    },
    fundingPoolLedgerService: {
      listPools: async () => fundingPoolService.listPools(),
      listEntries: async () => fundingPoolService.listEntries(),
      listAudits: async () => fundingPoolService.listAuditRecords(),
      recharge: async (input: Parameters<typeof fundingPoolService.recharge>[0]) => fundingPoolService.recharge(input),
    },
    pointGrantAdminService: {
      listBatches: async () => pointGrantService.listBatches(),
      listDetails: async (batchId?: string) => pointGrantService.listDetails(batchId),
      listPending: async () => pointGrantService.listPendingAccounts(),
      listLedger: async () => pointGrantService.listLedgerEntries(),
      listRewards: async () => pointGrantService.listRewardRecords(),
      previewDemoExcel: async (fileName: string, idempotentKey: string) =>
        pointGrantService.previewBatch({
          fundingPoolId: "pool-point-main",
          sourceOrganizationId: "ORG-GOV-001",
          sourceOrganizationName: "示例积分发放机构",
          fileName,
          idempotentKey,
          rows: [
            { recipientName: "王*", phone: registeredPhone, pointAmount: 500, cashEquivalent: 500 },
            { recipientName: "李*", phone: pendingPhone, pointAmount: 300, cashEquivalent: 300 },
            { recipientName: "格式错误", phone: "123", pointAmount: 100, cashEquivalent: 100 },
          ],
        }),
      approve: async (batchId: string, operatorId: string) => pointGrantService.approveBatch(batchId, operatorId),
      execute: async (batchId: string, idempotentKey: string) => pointGrantService.executeBatch(batchId, idempotentKey),
      claim: async (input: Parameters<typeof pointGrantService.claimPending>[0]) => pointGrantService.claimPending(input),
      claimDemo: async (pendingAccountId: string) =>
        pointGrantService.claimPending({
          pendingAccountId,
          verifiedPhone: pendingPhone,
          userId: "U-DEMO-CLAIM",
          idempotentKey: `ui-claim:${pendingAccountId}`,
        }),
    },
    couponFundingService: {
      listBatches: async (): Promise<CouponFundingBatch[]> => clone(v03CouponFundingBatches),
      listPools: async () => fundingPoolService.listPools().filter((item) => item.type === "COUPON"),
    },
  };
}

export const v03MockServices = createV03MockServices();
