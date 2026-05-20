import {
  createAdminUser,
  deleteAdminUser,
  getAdminUserByEmail,
  getAdminUserById,
  getAdminUserRoleClass,
  getAdminUserRoleLabel,
  getAdminUsers,
  getAdminUsersByCompanyId,
  getAdminUsersByDepartmentId,
  getAdminUsersByRole,
  getAdminUsersByStatus,
  getAdminUserStatusClass,
  getAdminUserStatusLabel,
  resetAdminUsers,
  saveAdminUsers,
  updateAdminUser,
  updateAdminUserLastLogin,
} from "./adminUserStorage";

import type {
  AdminUser,
  AdminUserStatus,
} from "./adminUserStorage";

import type {
  UserRole,
} from "./userStorage";

export type AdminUserCreateInput = Omit<
  AdminUser,
  "id" | "createdAt" | "updatedAt"
>;

export type AdminUserUpdateInput =
  Partial<
    Omit<
      AdminUser,
      "id" | "createdAt" | "updatedAt"
    >
  >;

export type AdminUserRepository = {
  list: () => AdminUser[];
  search: (query: string) => AdminUser[];
  findById: (id: string) => AdminUser | null;
  findByEmail: (email: string) => AdminUser | null;
  create: (user: AdminUserCreateInput) => AdminUser;
  update: (
    id: string,
    updates: AdminUserUpdateInput
  ) => AdminUser | null;
  delete: (id: string) => void;
  saveAll: (users: AdminUser[]) => void;
  reset: () => void;

  updateLastLogin: (email: string) => AdminUser | null;

  listByStatus: (status: AdminUserStatus) => AdminUser[];
  listByRole: (role: UserRole) => AdminUser[];
  listByCompanyId: (companyId: string) => AdminUser[];
  listByDepartmentId: (departmentId: string) => AdminUser[];

  countAll: () => number;
  countByStatus: (status: AdminUserStatus) => number;
  countByRole: (role: UserRole) => number;

  getRoleLabel: (role: UserRole | string) => string;
  getRoleClass: (role: UserRole | string) => string;
  getStatusLabel: (status: AdminUserStatus | string) => string;
  getStatusClass: (status: AdminUserStatus | string) => string;
};

function userMatchesQuery(
  user: AdminUser,
  query: string
) {
  const normalizedQuery =
    query
      .trim()
      .toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    user.id,
    user.name,
    user.email,
    user.role,
    user.status,
    user.companyId,
    user.departmentId,
    user.company,
    user.department,
    user.createdAt,
    user.updatedAt,
    user.lastLoginAt,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(
    normalizedQuery
  );
}

export const localAdminUserRepository: AdminUserRepository = {
  list() {
    return getAdminUsers();
  },

  search(
    query: string
  ) {
    return getAdminUsers().filter(
      (user) =>
        userMatchesQuery(
          user,
          query
        )
    );
  },

  findById(
    id: string
  ) {
    return getAdminUserById(
      id
    );
  },

  findByEmail(
    email: string
  ) {
    return getAdminUserByEmail(
      email
    );
  },

  create(
    user: AdminUserCreateInput
  ) {
    return createAdminUser(
      user
    );
  },

  update(
    id: string,
    updates: AdminUserUpdateInput
  ) {
    return updateAdminUser(
      id,
      updates
    );
  },

  delete(
    id: string
  ) {
    deleteAdminUser(
      id
    );
  },

  saveAll(
    users: AdminUser[]
  ) {
    saveAdminUsers(
      users
    );
  },

  reset() {
    resetAdminUsers();
  },

  updateLastLogin(
    email: string
  ) {
    return updateAdminUserLastLogin(
      email
    );
  },

  listByStatus(
    status: AdminUserStatus
  ) {
    return getAdminUsersByStatus(
      status
    );
  },

  listByRole(
    role: UserRole
  ) {
    return getAdminUsersByRole(
      role
    );
  },

  listByCompanyId(
    companyId: string
  ) {
    return getAdminUsersByCompanyId(
      companyId
    );
  },

  listByDepartmentId(
    departmentId: string
  ) {
    return getAdminUsersByDepartmentId(
      departmentId
    );
  },

  countAll() {
    return getAdminUsers().length;
  },

  countByStatus(
    status: AdminUserStatus
  ) {
    return getAdminUsersByStatus(
      status
    ).length;
  },

  countByRole(
    role: UserRole
  ) {
    return getAdminUsersByRole(
      role
    ).length;
  },

  getRoleLabel(
    role: UserRole | string
  ) {
    return getAdminUserRoleLabel(
      role
    );
  },

  getRoleClass(
    role: UserRole | string
  ) {
    return getAdminUserRoleClass(
      role
    );
  },

  getStatusLabel(
    status: AdminUserStatus | string
  ) {
    return getAdminUserStatusLabel(
      status
    );
  },

  getStatusClass(
    status: AdminUserStatus | string
  ) {
    return getAdminUserStatusClass(
      status
    );
  },
};

export const adminUserRepository =
  localAdminUserRepository;