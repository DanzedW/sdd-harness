import { findRequirement, PC_REQUIREMENTS, type PcRequirement } from "../registry/pcRequirementRegistry";

export interface LedgerQuery {
  keyword?: string;
  group?: string;
  unconfirmed?: boolean;
}

export interface RequirementAuditReadModel {
  auditId: string;
  requirementId: string;
  action: string;
  status: string;
  operator: string;
  operatedAt: string;
}

export function createRequirementLedgerService() {
  const audits: RequirementAuditReadModel[] = [];

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

    async auditTrail(): Promise<RequirementAuditReadModel[]> {
      return audits.map((item) => ({ ...item }));
    },
  };
}

export const requirementLedgerService = createRequirementLedgerService();
