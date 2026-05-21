import {
  requestJson,
} from "./apiClient";

import type {
  AdminUser,
  AdminUserCreateInput,
  AdminUserStatus,
  AdminUserUpdateInput,
  UserRole,
} from "../types/user";

export type AdminUserRepository = {
  list: () => Promise<AdminUser[]>;
  search: (query: string) => Promise<AdminUser[]>;
  findById: (id: string) => Promise<AdminUser | null>;
  findByEmail: (email: string) => Promise<AdminUser | null>;
  create: (user: AdminUserCreateInput) => Promise<AdminUser>;
  update: (
    id: string,
    updates: AdminUserUpdateInput
  ) => Promise<AdminUser | null>;
  delete: (id: string) => Promise<void>;
  saveAll: (users: AdminUser[]) => Promise<void>;
  reset: () => Promise<void>;

  updateLastLogin: (email: string) => Promise<AdminUser | null>;

  listByStatus: (status: AdminUserStatus) => Promise<AdminUser[]>;
  listByRole: (role: UserRole) => Promise<AdminUser[]>;
  listByCompanyId: (companyId: string) => Promise<AdminUser[]>;
  listByDepartmentId: (departmentId: string) => Promise<AdminUser[]>;

  countAll: () => Promise<number>;
  countByStatus: (status: AdminUserStatus) => Promise<number>;
  countByRole: (role: UserRole) => Promise<number>;

  getRoleLabel: (role: UserRole | string) => string;
  getRoleClass: (role: UserRole | string) => string;
  getStatusLabel: (status: AdminUserStatus | string) => string;
  getStatusClass: (status: AdminUserStatus | string) => string;
};

function dispatchAdminUsersUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(
      "adminUsersUpdated"
    )
  );
}

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

export const postgresAdminUserRepository: AdminUserRepository = {
  async list() {
    return requestJson<AdminUser[]>(
      "/api/admin-users"
    );
  },

  async search(
    query: string
  ) {
    const users =
      await postgresAdminUserRepository.list();

    return users.filter(
      (user) =>
        userMatchesQuery(
          user,
          query
        )
    );
  },

  async findById(
    id: string
  ) {
    if (!id) {
      return null;
    }

    try {
      return await requestJson<AdminUser>(
        `/api/admin-users/${encodeURIComponent(
          id
        )}`
      );
    } catch {
      return null;
    }
  },

  async findByEmail(
    email: string
  ) {
    if (!email) {
      return null;
    }

    try {
      return await requestJson<AdminUser>(
        `/api/admin-users/by-email/${encodeURIComponent(
          email
        )}`
      );
    } catch {
      return null;
    }
  },

  async create(
    user: AdminUserCreateInput
  ) {
    const createdUser =
      await requestJson<AdminUser>(
        "/api/admin-users",
        {
          method:
            "POST",

          body:
            JSON.stringify(
              user
            ),
        }
      );

    dispatchAdminUsersUpdated();

    return createdUser;
  },

  async update(
    id: string,
    updates: AdminUserUpdateInput
  ) {
    if (!id) {
      return null;
    }

    const updatedUser =
      await requestJson<AdminUser>(
        `/api/admin-users/${encodeURIComponent(
          id
        )}`,
        {
          method:
            "PATCH",

          body:
            JSON.stringify(
              updates
            ),
        }
      );

    dispatchAdminUsersUpdated();

    return updatedUser;
  },

  async delete(
    id: string
  ) {
    if (!id) {
      return;
    }

    await requestJson<{
      ok: boolean;
    }>(
      `/api/admin-users/${encodeURIComponent(
        id
      )}`,
      {
        method:
          "DELETE",
      }
    );

    dispatchAdminUsersUpdated();
  },

  async saveAll(
    users: AdminUser[]
  ) {
    await Promise.all(
      users.map(
        async (user) => {
          if (user.id) {
            await postgresAdminUserRepository.update(
              user.id,
              user
            );

            return;
          }

          await postgresAdminUserRepository.create(
            user
          );
        }
      )
    );

    dispatchAdminUsersUpdated();
  },

  async reset() {
    throw new Error(
      "resetAdminUsers ist für PostgreSQL nicht verfügbar."
    );
  },

  async updateLastLogin(
    email: string
  ) {
    if (!email) {
      return null;
    }

    try {
      const updatedUser =
        await requestJson<AdminUser>(
          `/api/admin-users/by-email/${encodeURIComponent(
            email
          )}`,
          {
            method:
              "PATCH",
          }
        );

      dispatchAdminUsersUpdated();

      return updatedUser;
    } catch {
      return null;
    }
  },

  async listByStatus(
    status: AdminUserStatus
  ) {
    return requestJson<AdminUser[]>(
      `/api/admin-users?status=${encodeURIComponent(
        status
      )}`
    );
  },

  async listByRole(
    role: UserRole
  ) {
    return requestJson<AdminUser[]>(
      `/api/admin-users?role=${encodeURIComponent(
        role
      )}`
    );
  },

  async listByCompanyId(
    companyId: string
  ) {
    return requestJson<AdminUser[]>(
      `/api/admin-users?companyId=${encodeURIComponent(
        companyId
      )}`
    );
  },

  async listByDepartmentId(
    departmentId: string
  ) {
    return requestJson<AdminUser[]>(
      `/api/admin-users?departmentId=${encodeURIComponent(
        departmentId
      )}`
    );
  },

  async countAll() {
    const users =
      await postgresAdminUserRepository.list();

    return users.length;
  },

  async countByStatus(
    status: AdminUserStatus
  ) {
    const users =
      await postgresAdminUserRepository.listByStatus(
        status
      );

    return users.length;
  },

  async countByRole(
    role: UserRole
  ) {
    const users =
      await postgresAdminUserRepository.listByRole(
        role
      );

    return users.length;
  },

  getRoleLabel(
    role: UserRole | string
  ) {
    if (role === "admin") {
      return "Administrator";
    }

    if (role === "editor") {
      return "Bearbeiter";
    }

    return "Leser";
  },

  getRoleClass(
    role: UserRole | string
  ) {
    if (role === "admin") {
      return "bg-red-50 text-red-700";
    }

    if (role === "editor") {
      return "bg-indigo-50 text-indigo-700";
    }

    return "bg-zinc-100 text-zinc-700";
  },

  getStatusLabel(
    status: AdminUserStatus | string
  ) {
    if (status === "active") {
      return "Aktiv";
    }

    if (status === "invited") {
      return "Eingeladen";
    }

    if (status === "inactive") {
      return "Inaktiv";
    }

    return String(
      status ||
        "Unbekannt"
    );
  },

  getStatusClass(
    status: AdminUserStatus | string
  ) {
    if (status === "active") {
      return "bg-green-50 text-green-700";
    }

    if (status === "invited") {
      return "bg-blue-50 text-blue-700";
    }

    if (status === "inactive") {
      return "bg-zinc-100 text-zinc-700";
    }

    return "bg-zinc-100 text-zinc-700";
  },
};

export const adminUserRepository =
  postgresAdminUserRepository;