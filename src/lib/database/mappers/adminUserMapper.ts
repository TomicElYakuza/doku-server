import type {
  AdminUser,
  AdminUserStatus,
  UserRole,
} from "../../../types/user";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  company_id: string | null;
  department_id: string | null;
  company: string | null;
  department: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export function mapAdminUserRow(
  row: AdminUserRow
): AdminUser {
  return {
    id:
      row.id,

    name:
      row.name,

    email:
      row.email,

    role:
      row.role as UserRole,

    status:
      row.status as AdminUserStatus,

    companyId:
      row.company_id ||
      "",

    departmentId:
      row.department_id ||
      "",

    company:
      row.company ||
      "Intern",

    department:
      row.department ||
      "Allgemein",

    lastLoginAt:
      row.last_login_at ||
      "",

    createdAt:
      new Date(
        row.created_at
      ).toLocaleString(),

    updatedAt:
      new Date(
        row.updated_at
      ).toLocaleString(),
  };
}