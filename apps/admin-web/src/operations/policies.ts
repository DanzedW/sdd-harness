type RequirementSafety = { unconfirmed: boolean };
export type RequirementAction = "view" | "execute";

export function canExecuteRequirement(requirement: RequirementSafety, action: RequirementAction) {
  return action === "view" || !requirement.unconfirmed;
}

function requireInteger(value: number) {
  if (!Number.isInteger(value)) throw new Error("value must be an integer");
}

export function centsToYuan(cents: number) {
  requireInteger(cents);
  return `¥${(cents / 100).toFixed(2)}`;
}

export function basisPointsToPercent(basisPoints: number) {
  requireInteger(basisPoints);
  return `${(basisPoints / 100).toFixed(2)}%`;
}
