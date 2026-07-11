import type {
  CommerceAction,
  CommerceCase,
  CommerceStage,
  CreateCommerceCaseInput,
} from "../domain/commerceWorkflow";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface WorkflowState {
  cases: CommerceCase[];
  idempotencyResults: Record<string, CommerceCase>;
}

const STORAGE_KEY = "digital-life:commerce-workflow:v1";

const MAIN_TRANSITIONS: Partial<Record<CommerceStage, Partial<Record<CommerceAction, CommerceStage>>>> = {
  MERCHANT_REVIEW: { APPROVE_MERCHANT: "PRODUCT_PUBLISH" },
  PRODUCT_PUBLISH: { PUBLISH_PRODUCT: "PAYMENT" },
  PAYMENT: { CONFIRM_PAYMENT: "FULFILLMENT", REQUEST_REFUND: "REFUNDING" },
  FULFILLMENT: { CONFIRM_FULFILLMENT: "SETTLEMENT", REQUEST_REFUND: "REFUNDING" },
  SETTLEMENT: {
    COMPLETE_SETTLEMENT: "COMPLETED",
    FLAG_RECONCILIATION: "RECONCILIATION",
    REQUEST_REFUND: "REFUNDING",
  },
  RECONCILIATION: { RESOLVE_RECONCILIATION: "SETTLEMENT" },
  REFUNDING: { COMPLETE_REFUND: "REFUNDED" },
};

const NEXT_ACTION: Partial<Record<CommerceStage, CommerceAction>> = {
  MERCHANT_REVIEW: "APPROVE_MERCHANT",
  PRODUCT_PUBLISH: "PUBLISH_PRODUCT",
  PAYMENT: "CONFIRM_PAYMENT",
  FULFILLMENT: "CONFIRM_FULFILLMENT",
  SETTLEMENT: "COMPLETE_SETTLEMENT",
  RECONCILIATION: "RESOLVE_RECONCILIATION",
  REFUNDING: "COMPLETE_REFUND",
};

function nowText() {
  return new Date().toLocaleString("zh-CN", { hour12: false });
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function seedCases(): CommerceCase[] {
  const now = nowText();
  return [
    {
      id: "CASE-001",
      merchantName: "江南生活馆",
      productName: "城市生活权益包",
      orderNo: "DL202607110001",
      orderAmount: 19_900,
      stage: "MERCHANT_REVIEW",
      riskMessage: "",
      updatedAt: now,
      audits: [],
    },
    {
      id: "CASE-002",
      merchantName: "云上便利店",
      productName: "夏日清凉组合",
      orderNo: "DL202607110002",
      orderAmount: 8_800,
      stage: "SETTLEMENT",
      riskMessage: "",
      updatedAt: now,
      audits: [],
    },
    {
      id: "CASE-003",
      merchantName: "青禾到家",
      productName: "家庭保洁服务",
      orderNo: "DL202607110003",
      orderAmount: 29_900,
      stage: "FULFILLMENT",
      riskMessage: "服务履约凭证待运营确认",
      updatedAt: now,
      audits: [],
    },
  ];
}

function browserStorage(): StorageLike | undefined {
  return typeof window !== "undefined" ? window.localStorage : undefined;
}

export function getAvailableActions(caseItem: CommerceCase): CommerceAction[] {
  return Object.keys(MAIN_TRANSITIONS[caseItem.stage] ?? {}) as CommerceAction[];
}

export function getNextAction(caseItem: CommerceCase): CommerceAction | undefined {
  return NEXT_ACTION[caseItem.stage];
}

export function createCommerceWorkflowService(storage: StorageLike | undefined = browserStorage()) {
  function read(): WorkflowState {
    const raw = storage?.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as WorkflowState;
      } catch {
        storage?.removeItem(STORAGE_KEY);
      }
    }
    const initial = { cases: seedCases(), idempotencyResults: {} };
    storage?.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  function write(state: WorkflowState) {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  return {
    list(): CommerceCase[] {
      return clone(read().cases);
    },

    get(id: string): CommerceCase {
      const found = read().cases.find((item) => item.id === id);
      if (!found) throw new Error(`业务案例不存在：${id}`);
      return clone(found);
    },

    createCase(input: CreateCommerceCaseInput): CommerceCase {
      if (!Number.isInteger(input.orderAmount) || input.orderAmount < 0) {
        throw new Error("订单金额必须使用非负整数分");
      }
      const state = read();
      const created: CommerceCase = {
        id: `CASE-${String(state.cases.length + 1).padStart(3, "0")}`,
        merchantName: input.merchantName,
        productName: input.productName,
        orderNo: `DL${Date.now()}`,
        orderAmount: input.orderAmount,
        stage: "MERCHANT_REVIEW",
        riskMessage: "",
        updatedAt: nowText(),
        audits: [],
      };
      state.cases.unshift(created);
      write(state);
      return clone(created);
    },

    act(
      id: string,
      action: CommerceAction,
      operator: string,
      idempotencyKey: string,
      note = "",
    ): CommerceCase {
      const state = read();
      const replay = state.idempotencyResults[idempotencyKey];
      if (replay) return clone(replay);
      const index = state.cases.findIndex((item) => item.id === id);
      if (index < 0) throw new Error(`业务案例不存在：${id}`);
      const current = state.cases[index];
      const nextStage = MAIN_TRANSITIONS[current.stage]?.[action];
      if (!nextStage) throw new Error(`当前阶段不允许执行：${action}`);
      const changedAt = nowText();
      const next: CommerceCase = {
        ...current,
        stage: nextStage,
        riskMessage: nextStage === "RECONCILIATION" ? note || "存在待核对差异" : "",
        updatedAt: changedAt,
        audits: [
          ...current.audits,
          {
            id: `${id}-AUDIT-${current.audits.length + 1}`,
            action,
            operator,
            fromStage: current.stage,
            toStage: nextStage,
            note,
            createdAt: changedAt,
          },
        ],
      };
      state.cases[index] = next;
      state.idempotencyResults[idempotencyKey] = next;
      write(state);
      return clone(next);
    },

    reset(): CommerceCase[] {
      const next = { cases: seedCases(), idempotencyResults: {} };
      write(next);
      return clone(next.cases);
    },
  };
}

export const commerceWorkflowService = createCommerceWorkflowService();
