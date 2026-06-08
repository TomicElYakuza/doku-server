import type {
  RolePermissionTemplate,
} from "../../../types/rolePermissionTemplate";

export type RolePermissionTemplateRow = {
  template_key: string;
  name: string;
  description: string;
  role_key: string;
  permission_keys: string[];
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export function mapRolePermissionTemplateRow(
  row: RolePermissionTemplateRow,
): RolePermissionTemplate {
  return {
    key: row.template_key,
    name: row.name,
    description: row.description,
    roleKey: row.role_key,
    permissionKeys: Array.isArray(row.permission_keys)
      ? row.permission_keys
      : [],
    isDefault: row.is_default,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
