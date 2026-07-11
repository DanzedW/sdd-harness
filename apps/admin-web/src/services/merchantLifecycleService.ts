// services/merchantLifecycleService.ts

import type { Contract, Shop, QrCode, PageResult, QueryParams } from "../domain";
import { contracts, shops, qrCodes } from "../mocks/data-merchant-lifecycle";
import { createRepository } from "./mockRepository";

const contractRepo = createRepository<Contract>("dl:contracts", contracts, ["contractNo"]);
const shopRepo = createRepository<Shop>("dl:shops", shops, ["shopCode", "name"]);
const qrCodeRepo = createRepository<QrCode>("dl:qrcodes", qrCodes, ["code"]);

let _idCounter = 200;
function uid(): string { return `gen-${Date.now()}-${++_idCounter}`; }

export const contractService = {
  query: (p?: QueryParams) => contractRepo.query(p),
  create: (d: Omit<Contract, "id" | "updatedAt">) =>
    contractRepo.save({ ...d, id: uid(), updatedAt: new Date().toISOString() } as Contract),
  update: (id: string, d: Partial<Contract>) =>
    contractRepo.save({ ...d, id } as Contract),
};

export const shopService = {
  query: (p?: QueryParams) => shopRepo.query(p),
  create: (d: Omit<Shop, "id" | "updatedAt">) =>
    shopRepo.save({ ...d, id: uid(), updatedAt: new Date().toISOString() } as Shop),
  update: (id: string, d: Partial<Shop>) =>
    shopRepo.save({ ...d, id } as Shop),
};

export const qrCodeService = {
  query: (p?: QueryParams) => qrCodeRepo.query(p),
  create: (d: Omit<QrCode, "id" | "updatedAt">) =>
    qrCodeRepo.save({ ...d, id: uid(), updatedAt: new Date().toISOString() } as QrCode),
  update: (id: string, d: Partial<QrCode>) =>
    qrCodeRepo.save({ ...d, id } as QrCode),
};
