import type {
  BasisPoints,
  FulfillmentState,
  PaymentState,
  PendingPointAccount,
  PointGrantBatch,
  PointGrantDetail,
  PointLedgerEntry,
  RewardPointRecord,
  TransactionScene,
} from "../domain";
import type { FundingPoolService } from "./fundingPoolService";
import {
  assertValidBasisPoints,
  assertValidCents,
  evaluateSettlementEligibility,
} from "./settlementRules";

export interface PointGrantRowInput {
  recipientName: string;
  phone: string;
  pointAmount: number;
  cashEquivalent: number;
}

interface CreatePointGrantServiceOptions {
  fundingPoolService: FundingPoolService;
  registeredUsers: Array<{ phoneHash: string; userId: string }>;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function hashPhoneForMock(phone: string): string {
  let hash = 0x811c9dc5;
  for (const character of phone) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return `mock-hash-v1:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function maskPhone(phone: string): string {
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

export function createPointGrantService(options: CreatePointGrantServiceOptions) {
  const batches: PointGrantBatch[] = [];
  const details: PointGrantDetail[] = [];
  const pendingAccounts: PendingPointAccount[] = [];
  const ledgerEntries: PointLedgerEntry[] = [];
  const rewardRecords: RewardPointRecord[] = [];
  const executionResults = new Map<string, { batch: PointGrantBatch; details: PointGrantDetail[] }>();
  const claimResults = new Map<string, { account: PendingPointAccount; ledgerEntry: PointLedgerEntry }>();
  const registeredUserByPhoneHash = new Map(
    options.registeredUsers.map((item) => [item.phoneHash, item.userId]),
  );
  let sequence = 0;
  const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);
  const nextId = (prefix: string) => `${prefix}-${Date.now()}-${++sequence}`;

  function requireBatch(batchId: string) {
    const batch = batches.find((item) => item.id === batchId);
    if (!batch) throw new Error(`point grant batch ${batchId} not found`);
    return batch;
  }

  function saveBatch(batch: PointGrantBatch) {
    const index = batches.findIndex((item) => item.id === batch.id);
    batches[index] = batch;
  }

  function saveDetail(detail: PointGrantDetail) {
    const index = details.findIndex((item) => item.id === detail.id);
    details[index] = detail;
  }

  function currentBalance(userId: string) {
    return ledgerEntries
      .filter((item) => item.userId === userId && item.status === "POSTED")
      .reduce((balance, item) => balance + (item.direction === "CREDIT" ? item.pointAmount : -item.pointAmount), 0);
  }

  function postCredit(input: {
    userId: string;
    pointAmount: number;
    cashEquivalent: number;
    businessType: PointLedgerEntry["businessType"];
    orderId: string | null;
    fundingPoolId: string;
    idempotentKey: string;
  }): PointLedgerEntry {
    const existing = ledgerEntries.find((item) => item.idempotentKey === input.idempotentKey);
    if (existing) return existing;
    const balanceBefore = currentBalance(input.userId);
    const timestamp = now();
    const entry: PointLedgerEntry = {
      id: nextId("point-ledger"),
      userId: input.userId,
      direction: "CREDIT",
      businessType: input.businessType,
      pointAmount: input.pointAmount,
      cashEquivalent: input.cashEquivalent,
      balanceBefore,
      balanceAfter: balanceBefore + input.pointAmount,
      orderId: input.orderId,
      fundingPoolId: input.fundingPoolId,
      idempotentKey: input.idempotentKey,
      status: "POSTED",
      reconciliationStatus: "NOT_STARTED",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    ledgerEntries.push(entry);
    return entry;
  }

  return {
    previewBatch(input: {
      fundingPoolId: string;
      sourceOrganizationId: string;
      sourceOrganizationName: string;
      fileName: string;
      idempotentKey: string;
      rows: PointGrantRowInput[];
    }) {
      const existing = batches.find((item) => item.idempotentKey === input.idempotentKey);
      if (existing) {
        return {
          batch: clone(existing),
          details: clone(details.filter((item) => item.batchId === existing.id)),
        };
      }
      const timestamp = now();
      const batchId = nextId("point-batch");
      const batchDetails = input.rows.map((row, index): PointGrantDetail => {
        const validPhone = /^1\d{10}$/.test(row.phone);
        const validPoints = Number.isInteger(row.pointAmount) && row.pointAmount > 0;
        const validCash = Number.isInteger(row.cashEquivalent) && row.cashEquivalent >= 0;
        const failureReason = !validPhone
          ? "phone must be an 11-digit mobile number"
          : !validPoints
            ? "point amount must be a positive integer"
            : !validCash
              ? "cash equivalent must use non-negative integer cents"
              : null;
        return {
          id: nextId("point-detail"),
          batchId,
          rowNumber: index + 2,
          recipientName: row.recipientName,
          phoneMasked: validPhone ? maskPhone(row.phone) : "INVALID",
          phoneHash: validPhone ? hashPhoneForMock(row.phone) : `invalid-row:${index + 2}`,
          userId: validPhone ? (registeredUserByPhoneHash.get(hashPhoneForMock(row.phone)) ?? null) : null,
          pointAmount: row.pointAmount,
          cashEquivalent: row.cashEquivalent,
          status: failureReason ? "INVALID" : "VALID",
          failureReason,
          updatedAt: timestamp,
        };
      });
      const validDetails = batchDetails.filter((item) => item.status === "VALID");
      const batch: PointGrantBatch = {
        id: batchId,
        batchNo: nextId("PGB"),
        sourceType: "ORGANIZATION",
        sourceOrganizationId: input.sourceOrganizationId,
        sourceOrganizationName: input.sourceOrganizationName,
        fundingPoolId: input.fundingPoolId,
        fileName: input.fileName,
        totalCount: batchDetails.length,
        validCount: validDetails.length,
        failedCount: batchDetails.length - validDetails.length,
        totalPoints: validDetails.reduce((sum, item) => sum + item.pointAmount, 0),
        idempotentKey: input.idempotentKey,
        status: "PENDING_APPROVAL",
        approvedBy: null,
        approvedAt: null,
        executedAt: null,
        updatedAt: timestamp,
      };
      batches.push(batch);
      details.push(...batchDetails);
      return { batch: clone(batch), details: clone(batchDetails) };
    },

    approveBatch(batchId: string, operatorId: string) {
      const batch = requireBatch(batchId);
      if (batch.executedAt) throw new Error("executed batch cannot be approved again");
      const updated = { ...batch, approvedBy: operatorId, approvedAt: now(), updatedAt: now() };
      saveBatch(updated);
      return clone(updated);
    },

    executeBatch(batchId: string, executionIdempotentKey: string) {
      const existingResult = executionResults.get(executionIdempotentKey);
      if (existingResult) return clone(existingResult);
      const batch = requireBatch(batchId);
      if (!batch.approvedBy) throw new Error("point grant batch must be approved before execution");
      if (batch.executedAt) {
        return {
          batch: clone(batch),
          details: clone(details.filter((item) => item.batchId === batch.id)),
        };
      }
      let executionFailures = 0;
      for (const detail of details.filter((item) => item.batchId === batch.id && item.status === "VALID")) {
        try {
          options.fundingPoolService.issue({
            poolId: batch.fundingPoolId,
            amount: detail.cashEquivalent,
            businessReference: detail.id,
            idempotentKey: `point-grant:${detail.id}`,
            operatorId: batch.approvedBy,
          });
          const timestamp = now();
          if (detail.userId) {
            postCredit({
              userId: detail.userId,
              pointAmount: detail.pointAmount,
              cashEquivalent: detail.cashEquivalent,
              businessType: "ORGANIZATION_GRANT",
              orderId: null,
              fundingPoolId: batch.fundingPoolId,
              idempotentKey: `point-grant-ledger:${detail.id}`,
            });
            saveDetail({ ...detail, status: "POSTED", updatedAt: timestamp });
          } else {
            const pending: PendingPointAccount = {
              id: nextId("pending-point"),
              phoneMasked: detail.phoneMasked,
              phoneHash: detail.phoneHash,
              grantDetailId: detail.id,
              pointAmount: detail.pointAmount,
              cashEquivalent: detail.cashEquivalent,
              status: "PENDING",
              claimedUserId: null,
              claimedAt: null,
              expiresAt: null,
              updatedAt: timestamp,
            };
            pendingAccounts.push(pending);
            saveDetail({ ...detail, status: "PENDING_CLAIM", updatedAt: timestamp });
          }
        } catch (error) {
          executionFailures += 1;
          saveDetail({
            ...detail,
            status: "FAILED",
            failureReason: error instanceof Error ? error.message : String(error),
            updatedAt: now(),
          });
        }
      }
      const timestamp = now();
      const hasFailures = batch.failedCount > 0 || executionFailures > 0;
      const updatedBatch: PointGrantBatch = {
        ...batch,
        failedCount: batch.failedCount + executionFailures,
        status: hasFailures ? "PARTIAL" : "SUCCESS",
        executedAt: timestamp,
        updatedAt: timestamp,
      };
      saveBatch(updatedBatch);
      const result = {
        batch: clone(updatedBatch),
        details: clone(details.filter((item) => item.batchId === batch.id)),
      };
      executionResults.set(executionIdempotentKey, result);
      return clone(result);
    },

    claimPending(input: {
      pendingAccountId: string;
      verifiedPhone: string;
      userId: string;
      idempotentKey: string;
    }) {
      const previous = claimResults.get(input.idempotentKey);
      if (previous) return clone(previous);
      const index = pendingAccounts.findIndex((item) => item.id === input.pendingAccountId);
      if (index < 0) throw new Error("pending point account not found");
      const account = pendingAccounts[index];
      if (account.phoneHash !== hashPhoneForMock(input.verifiedPhone)) {
        throw new Error("verified phone does not match pending account");
      }
      if (account.status === "CLAIMED") {
        if (account.claimedUserId !== input.userId) throw new Error("pending points already claimed by another user");
        const existingLedger = ledgerEntries.find((item) => item.idempotentKey === input.idempotentKey);
        if (!existingLedger) throw new Error("claim ledger entry not found");
        return { account: clone(account), ledgerEntry: clone(existingLedger) };
      }
      if (account.status !== "PENDING") throw new Error(`cannot claim pending points from ${account.status}`);
      const timestamp = now();
      const claimed = {
        ...account,
        status: "CLAIMED" as const,
        claimedUserId: input.userId,
        claimedAt: timestamp,
        updatedAt: timestamp,
      };
      pendingAccounts[index] = claimed;
      const ledgerEntry = postCredit({
        userId: input.userId,
        pointAmount: account.pointAmount,
        cashEquivalent: account.cashEquivalent,
        businessType: "ORGANIZATION_GRANT",
        orderId: null,
        fundingPoolId: requireBatch(
          details.find((item) => item.id === account.grantDetailId)?.batchId ?? "",
        ).fundingPoolId,
        idempotentKey: input.idempotentKey,
      });
      const result = { account: clone(claimed), ledgerEntry: clone(ledgerEntry) };
      claimResults.set(input.idempotentKey, result);
      return clone(result);
    },

    usePoints(input: {
      fundingPoolId: string;
      userId: string;
      orderId: string;
      pointAmount: number;
      cashEquivalent: number;
      balanceBefore: number;
      idempotentKey: string;
    }) {
      assertValidCents(input.cashEquivalent, "point use cash equivalent");
      if (!Number.isInteger(input.pointAmount) || input.pointAmount <= 0) {
        throw new Error("point amount must be a positive integer");
      }
      if (input.pointAmount > input.balanceBefore) throw new Error("insufficient point balance");
      const fundingResult = options.fundingPoolService.occupy({
        poolId: input.fundingPoolId,
        amount: input.cashEquivalent,
        businessReference: input.orderId,
        idempotentKey: `funding:${input.idempotentKey}`,
        operatorId: "mock-system",
      });
      const existing = ledgerEntries.find((item) => item.idempotentKey === input.idempotentKey);
      if (existing) return { ledgerEntry: clone(existing), pool: fundingResult.pool };
      const timestamp = now();
      const ledgerEntry: PointLedgerEntry = {
        id: nextId("point-ledger"),
        userId: input.userId,
        direction: "DEBIT",
        businessType: "POINT_USE",
        pointAmount: input.pointAmount,
        cashEquivalent: input.cashEquivalent,
        balanceBefore: input.balanceBefore,
        balanceAfter: input.balanceBefore - input.pointAmount,
        orderId: input.orderId,
        fundingPoolId: input.fundingPoolId,
        idempotentKey: input.idempotentKey,
        status: "POSTED",
        reconciliationStatus: "NOT_STARTED",
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      ledgerEntries.push(ledgerEntry);
      return { ledgerEntry: clone(ledgerEntry), pool: fundingResult.pool };
    },

    rewardTransaction(input: {
      fundingPoolId: string;
      orderId: string;
      userId: string;
      profileSnapshotId: string;
      transactionScene: TransactionScene;
      paymentState: PaymentState;
      fulfillmentState: FulfillmentState;
      calculationBase: number;
      rewardRateBps: BasisPoints;
      pointAmount: number;
      cashEquivalent: number;
      idempotentKey: string;
    }) {
      const existing = rewardRecords.find((item) => item.idempotentKey === input.idempotentKey);
      if (existing) {
        const ledgerEntry = ledgerEntries.find((item) => item.idempotentKey === input.idempotentKey);
        if (!ledgerEntry) throw new Error("reward ledger entry not found");
        return { reward: clone(existing), ledgerEntry: clone(ledgerEntry) };
      }
      const eligibility = evaluateSettlementEligibility(input);
      if (eligibility !== "ELIGIBLE") throw new Error(`transaction is not eligible for reward: ${eligibility}`);
      assertValidCents(input.calculationBase, "reward calculation base");
      assertValidBasisPoints(input.rewardRateBps, "reward rate");
      assertValidCents(input.cashEquivalent, "reward cash equivalent");
      options.fundingPoolService.issue({
        poolId: input.fundingPoolId,
        amount: input.cashEquivalent,
        businessReference: input.orderId,
        idempotentKey: `funding:${input.idempotentKey}`,
        operatorId: "mock-system",
      });
      const ledgerEntry = postCredit({
        userId: input.userId,
        pointAmount: input.pointAmount,
        cashEquivalent: input.cashEquivalent,
        businessType: "TRANSACTION_REWARD",
        orderId: input.orderId,
        fundingPoolId: input.fundingPoolId,
        idempotentKey: input.idempotentKey,
      });
      const timestamp = now();
      const reward: RewardPointRecord = {
        id: nextId("reward"),
        orderId: input.orderId,
        userId: input.userId,
        profileSnapshotId: input.profileSnapshotId,
        calculationBase: input.calculationBase,
        rewardRateBps: input.rewardRateBps,
        pointAmount: input.pointAmount,
        cashEquivalent: input.cashEquivalent,
        triggerType: input.transactionScene === "OFFLINE" ? "PAYMENT_SUCCESS" : "FULFILLMENT_COMPLETED",
        status: "GRANTED",
        idempotentKey: input.idempotentKey,
        lastErrorMessage: null,
        updatedAt: timestamp,
      };
      rewardRecords.push(reward);
      return { reward: clone(reward), ledgerEntry: clone(ledgerEntry) };
    },

    listBatches: () => clone(batches),
    listDetails: (batchId?: string) => clone(batchId ? details.filter((item) => item.batchId === batchId) : details),
    listPendingAccounts: () => clone(pendingAccounts),
    listLedgerEntries: () => clone(ledgerEntries),
    listRewardRecords: () => clone(rewardRecords),
    exportState: () => clone({ batches, details, pendingAccounts, ledgerEntries, rewardRecords }),
  };
}

export type PointGrantService = ReturnType<typeof createPointGrantService>;
