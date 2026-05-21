export type UserRole =
  | "admin"
  | "editor"
  | "viewer";

export type AdminUserStatus =
  | "active"
  | "invited"
  | "inactive";

export type User = {
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  departmentId: string;
  company: string;
  department: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AdminUserStatus;
  companyId: string;
  departmentId: string;
  company: string;
  department: string;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserCreateInput = Omit<
  AdminUser,
  "id" | "createdAt" | "updatedAt" | "lastLoginAt"
>;

export type AdminUserUpdateInput =
  Partial<
    Omit<
      AdminUser,
      "id" | "createdAt" | "updatedAt"
    >
  >;