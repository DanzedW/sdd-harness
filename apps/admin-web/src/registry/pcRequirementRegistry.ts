import source from "../../../../experiment/requirements.pc.json";

export interface PcRequirement {
  id: string;
  excelRow: number;
  group: string;
  module: string;
  detail: string;
  sourceSha256: string;
  unconfirmed: boolean;
  route: string;
  page: "ledger" | "financial";
}

const FINANCIAL_PATTERN = /支付|退款|分账|结算|对账|资金|金额|费率|佣金|提现|充值/;

export const PC_REQUIREMENTS: readonly PcRequirement[] = Object.freeze(
  source.requirements.map((item) => ({
    ...item,
    route: `/operations/${item.id.toLowerCase()}`,
    page: FINANCIAL_PATTERN.test(`${item.group}${item.module}${item.detail}`) ? ("financial" as const) : ("ledger" as const),
  })),
);

export const PC_REQUIREMENT_GROUPS = Object.freeze([...new Set(PC_REQUIREMENTS.map((item) => item.group))]);

export function findRequirement(id: string): PcRequirement | undefined {
  return PC_REQUIREMENTS.find((item) => item.id === id);
}

export function validateRegistry(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (PC_REQUIREMENTS.length !== 93) errors.push(`expected 93 requirements, got ${PC_REQUIREMENTS.length}`);
  PC_REQUIREMENTS.forEach((item, index) => {
    const expected = `PC-${String(index + 80).padStart(3, "0")}`;
    if (item.id !== expected) errors.push(`expected ${expected}, got ${item.id}`);
  });
  if (new Set(PC_REQUIREMENTS.map((item) => item.id)).size !== PC_REQUIREMENTS.length) errors.push("duplicate ids");
  if (PC_REQUIREMENT_GROUPS.length !== 17) errors.push(`expected 17 groups, got ${PC_REQUIREMENT_GROUPS.length}`);
  if (PC_REQUIREMENTS.filter((item) => item.unconfirmed).length !== 24) errors.push("expected 24 UNCONFIRMED");
  return { valid: errors.length === 0, errors };
}
