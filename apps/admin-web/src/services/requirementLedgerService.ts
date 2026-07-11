import { findRequirement, PC_REQUIREMENTS, type PcRequirement } from "../registry/pcRequirementRegistry";

export interface LedgerQuery {
  keyword?: string;
  group?: string;
  unconfirmed?: boolean;
}

export interface FinancialInput {
  amountCent?: number;
  rateBp?: number;
}

export interface RequirementAudit {
  auditId: string;
  requirementId: string;
  idempotencyKey: string;
  action: RequirementAuditAction;
  payloadHash: string;
  status: "SUCCESS";
  operator: string;
  operatedAt: string;
  input: FinancialInput;
}

export type RequirementAuditAction = "SIMULATE" | "PREVIEW";

function canonicalPayload(input: FinancialInput): string {
  return JSON.stringify(Object.fromEntries(Object.entries(input).sort(([left], [right]) => left.localeCompare(right))));
}

function hashCanonicalPayload(input: FinancialInput): string {
  const value = canonicalPayload(input);
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function assertFinancialInput(input: FinancialInput): void {
  if (input.amountCent !== undefined && (!Number.isInteger(input.amountCent) || input.amountCent < 0)) {
    throw new Error("金额必须为非负整数分");
  }
  if (input.rateBp !== undefined && (!Number.isInteger(input.rateBp) || input.rateBp < 0 || input.rateBp > 10_000)) {
    throw new Error("比例必须为 0..10000 的整数基点");
  }
}

export function createRequirementLedgerService() {
  const audits: RequirementAudit[] = [];
  const idempotency = new Map<string, { scope: string; audit: RequirementAudit }>();

  return {
    async query(query: LedgerQuery = {}): Promise<{ items: PcRequirement[]; total: number }> {
      const keyword = query.keyword?.trim().toLowerCase();
      const items = PC_REQUIREMENTS.filter((item) => {
        if (query.group && item.group !== query.group) return false;
        if (query.unconfirmed !== undefined && item.unconfirmed !== query.unconfirmed) return false;
        return !keyword || `${item.id} ${item.module} ${item.detail}`.toLowerCase().includes(keyword);
      });
      return { items: [...items], total: items.length };
    },

    async get(id: string): Promise<PcRequirement> {
      const item = findRequirement(id);
      if (!item) throw new Error(`需求不存在: ${id}`);
      return item;
    },

    async execute(id: string, idempotencyKey: string, action: RequirementAuditAction, input: FinancialInput = {}): Promise<RequirementAudit> {
      const requirement = findRequirement(id);
      if (!requirement) throw new Error(`需求不存在: ${id}`);
      if (requirement.unconfirmed) throw new Error(`${id} 为 UNCONFIRMED，真实动作已禁用`);
      assertFinancialInput(input);
      const payloadHash = hashCanonicalPayload(input);
      const scope = `${id}:${action}:${payloadHash}`;
      const existing = idempotency.get(idempotencyKey);
      if (existing) {
        if (existing.scope !== scope) throw new Error(`幂等键冲突: ${idempotencyKey} 已绑定不同 requirement/action/payload`);
        return existing.audit;
      }
      const audit: RequirementAudit = {
        auditId: `AUD-${String(audits.length + 1).padStart(4, "0")}`,
        requirementId: id,
        idempotencyKey,
        action,
        payloadHash,
        status: "SUCCESS",
        operator: "演示管理员",
        operatedAt: new Date().toISOString(),
        input,
      };
      audits.push(audit);
      idempotency.set(idempotencyKey, { scope, audit });
      return audit;
    },

    async auditTrail(): Promise<RequirementAudit[]> {
      return audits.map((item) => ({ ...item, input: { ...item.input } }));
    },
  };
}

const ledgerService = createRequirementLedgerService();
export const requirementLedgerService = {
  query: ledgerService.query,
  get: ledgerService.get,
  auditTrail: ledgerService.auditTrail,
};
