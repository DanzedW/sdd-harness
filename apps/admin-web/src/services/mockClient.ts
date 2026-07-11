import type { BaseRecord, PageResult, QueryParams } from "../types";

const MOCK_DELAY = 260;

export function wait<T>(value: T, delay = MOCK_DELAY): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), delay);
  });
}

export function queryRecords<T extends BaseRecord>(
  source: T[],
  params: QueryParams = {},
  fields: Array<keyof T> = [],
): Promise<PageResult<T>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const keyword = params.keyword?.trim().toLowerCase();
  const status = params.status;

  const filtered = source.filter((item) => {
    const statusMatched = !status || item.status === status;
    const keywordMatched =
      !keyword ||
      fields.some((field) => {
        const value = item[field];
        return String(value ?? "").toLowerCase().includes(keyword);
      });
    return statusMatched && keywordMatched;
  });

  const start = (page - 1) * pageSize;
  return wait({
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
  });
}
