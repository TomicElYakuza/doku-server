export type AdminModuleCategory =
  | "admin"
  | "content"
  | "tickets"
  | "system"
  | string;

export type AdminModuleConfig = {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  category: AdminModuleCategory;
  badgeLabel: string;
  sortOrder: number;
  isEnabled: boolean;
  isVisible: boolean;
  isCore: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminModuleCreateInput = {
  key: string;
  title: string;
  description?: string;
  href: string;
  icon?: string;
  category?: AdminModuleCategory;
  badgeLabel?: string;
  sortOrder?: number;
  isEnabled?: boolean;
  isVisible?: boolean;
  isCore?: boolean;
};

export type AdminModuleUpdateInput = Partial<Omit<AdminModuleCreateInput, "key">>;
