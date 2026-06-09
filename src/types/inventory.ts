export type InventoryAssetType =
  | "desktop"
  | "notebook"
  | "server"
  | "virtual_machine"
  | "printer"
  | "network"
  | "mobile"
  | "peripheral"
  | "other";

export type InventoryAssetStatus =
  | "active"
  | "in_stock"
  | "in_repair"
  | "retired"
  | "lost"
  | "archived";

export type InventoryAsset = {
  id: string;
  assetNumber: string;
  name: string;
  type: InventoryAssetType;
  status: InventoryAssetStatus;
  manufacturer: string;
  model: string;
  serialNumber: string;
  hostname: string;
  ipAddress: string;
  location: string;
  assignedUserId: string;
  assignedUserName: string;
  companyId: string;
  departmentId: string;
  operatingSystem: string;
  cpu: string;
  gpu: string;
  ramGb: number;
  storageGb: number;
  hardwareNotes: string;
  softwareNotes: string;
  purchaseDate: string;
  warrantyUntil: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
};

export type InventoryAssetInput = {
  assetNumber?: string;
  name?: string;
  type?: InventoryAssetType | string;
  status?: InventoryAssetStatus | string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  hostname?: string;
  ipAddress?: string;
  location?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  companyId?: string;
  departmentId?: string;
  operatingSystem?: string;
  cpu?: string;
  gpu?: string;
  ramGb?: number;
  storageGb?: number;
  hardwareNotes?: string;
  softwareNotes?: string;
  purchaseDate?: string;
  warrantyUntil?: string;
  lastSeenAt?: string;
};