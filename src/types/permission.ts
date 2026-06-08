export type PermissionScopeType =
  | "global"
  | "company"
  | "department"
  | "own";

export type PermissionCategory =
  | "Wiki"
  | "Tickets"
  | "Dateien"
  | "News"
  | "Benutzer"
  | "Organisation"
  | "System";

export type Permission = {
  id: string;
  permissionKey: string;
  label: string;
  description: string;
  category: PermissionCategory | string;
  createdAt: string;
  updatedAt: string;
};

export type CompanyPermission = {
  id: string;
  companyId: string;
  permissionKey: string;
  createdAt: string;
};

export type DepartmentPermission = {
  id: string;
  departmentId: string;
  permissionKey: string;
  createdAt: string;
};

export type UserPermission = {
  id: string;
  userId: string;
  permissionKey: string;
  scopeType: PermissionScopeType;
  scopeId: string;
  createdAt: string;
};

export type PermissionAssignmentTarget =
  | "company"
  | "department"
  | "user";

export type PermissionAssignmentInput = {
  targetType: PermissionAssignmentTarget;
  targetId: string;
  permissionKeys: string[];
  scopeType?: PermissionScopeType;
  scopeId?: string;
};

export type EffectivePermissionContext = {
  userId: string;
  role: string;
  companyId: string;
  departmentId: string;
};

export type EffectivePermissionResult = {
  permissionKeys: string[];
};
