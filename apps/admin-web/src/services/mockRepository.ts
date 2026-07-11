import type { BaseRecord, PageResult, QueryParams } from "../types";
import { wait } from "./mockClient";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function nowText() {
  return new Date().toLocaleString("zh-CN", { hour12: false });
}

export function createRepository<T extends BaseRecord>(storageKey: string, seed: T[], searchFields: Array<keyof T>) {
  function readAllSync(): T[] {
    if (!canUseStorage()) {
      return clone(seed);
    }
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      const initial = clone(seed);
      window.localStorage.setItem(storageKey, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw) as T[];
    } catch {
      const initial = clone(seed);
      window.localStorage.setItem(storageKey, JSON.stringify(initial));
      return initial;
    }
  }

  function writeAllSync(records: T[]) {
    if (canUseStorage()) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(records));
      } catch (e) {
        if (e instanceof DOMException && e.name === "QuotaExceededError") {
          console.warn(`[mockRepository] localStorage 写入失败：存储空间不足 (${storageKey})`);
        } else {
          console.warn(`[mockRepository] localStorage 写入失败：`, e);
        }
      }
    }
  }

  return {
    all: () => wait(readAllSync()),

    query: (params: QueryParams = {}): Promise<PageResult<T>> => {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 10;
      const keyword = params.keyword?.trim().toLowerCase();
      const status = params.status;
      const filtered = readAllSync().filter((item) => {
        const statusMatched = !status || item.status === status;
        const keywordMatched =
          !keyword ||
          searchFields.some((field) => String(item[field] ?? "").toLowerCase().includes(keyword));
        return statusMatched && keywordMatched;
      });
      const start = (page - 1) * pageSize;
      return wait({ items: filtered.slice(start, start + pageSize), total: filtered.length });
    },

    save: (record: T): Promise<T> => {
      const records = readAllSync();
      // 幂等校验：如果记录有 idempotentKey，先查是否已存在相同 key 的记录
      if ("idempotentKey" in record && (record as Record<string, unknown>).idempotentKey) {
        const key = (record as Record<string, unknown>).idempotentKey as string;
        const existing = records.find((item) => {
          const itemRecord = item as Record<string, unknown>;
          return "idempotentKey" in itemRecord && itemRecord.idempotentKey === key;
        });
        if (existing) {
          return wait(existing);
        }
      }
      const nextRecord = { ...record, updatedAt: nowText() };
      const index = records.findIndex((item) => item.id === record.id);
      const nextRecords = index >= 0 ? records.map((item) => (item.id === record.id ? nextRecord : item)) : [nextRecord, ...records];
      writeAllSync(nextRecords);
      return wait(nextRecord);
    },

    remove: (id: string): Promise<void> => {
      writeAllSync(readAllSync().filter((item) => item.id !== id));
      return wait(undefined);
    },

    reset: (): Promise<T[]> => {
      const initial = clone(seed);
      writeAllSync(initial);
      return wait(initial);
    },
  };
}
