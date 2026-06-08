import type {
  UserRole,
} from "./user";

export type RolePermissionTemplate = {
  key: string;
  name: string;
  description: string;
  roleKey: UserRole | string;
  permissionKeys: string[];
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type RolePermissionTemplateCreateInput = {
  key: string;
  name: string;
  description?: string;
  roleKey?: UserRole | string;
  permissionKeys?: string[];
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

export type RolePermissionTemplateUpdateInput = Partial<Omit<RolePermissionTemplateCreateInput, "key">>;
