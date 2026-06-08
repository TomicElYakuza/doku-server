import type {
  AdminUser,
  AdminUserStatus,
  UserRole,
} from "../../../types/user";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  password_hash?: string | null;
  password_must_change?: boolean | null;
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

function normalizeRole(
  role: string
): UserRole {
  if (role === "admin") {
    return "admin";
  }

  if (role === "department_lead") {
    return "department_lead";
  }

  return "employee";
}

function normalizeStatus(
  status: string
): AdminUserStatus {
  if (status === "active") {
    return "active";
  }

  if (status === "invited") {
    return "invited";
  }

  return "inactive";
}

function getFallbackUsername(
  email: string
) {
  return email
    .split("@")[0]
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      "."
    );
}

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

    username:
      row.username ||
      getFallbackUsername(
        row.email
      ),

    role:
      normalizeRole(
        row.role
      ),

    status:
      normalizeStatus(
        row.status
      ),

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
      "",

    passwordMustChange:
      Boolean(
        row.password_must_change
      ),

    hasPassword:
      Boolean(
        row.password_hash
      ),

    lastLoginAt:
      row.last_login_at ||
      "",

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}


