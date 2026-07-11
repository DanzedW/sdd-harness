import type { OperationRequirement } from "../operations/registry";
import { OPERATION_REQUIREMENTS } from "../operations/registry";

export interface OperationsQuery {
  keyword?: string;
  group?: string;
  page?: number;
  pageSize?: number;
}

export interface OperationsResult {
  items: OperationRequirement[];
  total: number;
}

export const operationsService = {
  async query(params: OperationsQuery = {}): Promise<OperationsResult> {
    const keyword = params.keyword?.trim();
    const filtered = OPERATION_REQUIREMENTS.filter((item) =>
      (!params.group || item.group === params.group) &&
      (!keyword || `${item.id}${item.group}${item.module}${item.detail}`.includes(keyword)),
    );
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return { items: filtered.slice(start, start + pageSize), total: filtered.length };
  },
};
