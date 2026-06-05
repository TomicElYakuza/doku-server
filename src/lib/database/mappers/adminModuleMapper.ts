import type {
  AdminModuleConfig,
} from "../../../types/adminModule";

export type AdminModuleRow = {
  module_key: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  category: string;
  badge_label: string;
  sort_order: number;
  is_enabled: boolean;
  is_visible: boolean;
  is_core: boolean;
  created_at: string;
  updated_at: string;
};

export function mapAdminModuleRow(
  row: AdminModuleRow,
): AdminModuleConfig {
  return {
    key: row.module_key,
    title: row.title,
    description: row.description,
    href: row.href,
    icon: row.icon,
    category: row.category,
    badgeLabel: row.badge_label,
    sortOrder: row.sort_order,
    isEnabled: row.is_enabled,
    isVisible: row.is_visible,
    isCore: row.is_core,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}