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
  passwordMustChange: boolean;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  status: AdminUserStatus;
  companyId: string;
  departmentId: string;
  company: string;
  department: string;
  passwordMustChange: boolean;
  hasPassword: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserCreateInput = {
  name: string;
  email: string;
  username: string;
  password: string;
  passwordMustChange: boolean;
  role: UserRole;
  status: AdminUserStatus;
  companyId: string;
  departmentId: string;
  company: string;
  department: string;
};

export type AdminUserUpdateInput = Partial<{
  name: string;
  email: string;
  username: string;
  password: string;
  passwordMustChange: boolean;
  role: UserRole;
  status: AdminUserStatus;
  companyId: string;
  departmentId: string;
  company: string;
  department: string;
  lastLoginAt: string;
}>;