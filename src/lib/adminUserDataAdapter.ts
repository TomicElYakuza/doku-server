import {
  applyPagination,
  createErrorResult,
  createLocalStorageAdapterMeta,
  createSuccessListResult,
  createSuccessResult,
  matchesSearchQuery,
} from "./dataAdapter";

import type {
  DataAdapter,
  DataAdapterQuery,
} from "./dataAdapter";

import {
  createAdminUser,
  deleteAdminUser,
  getAdminUserById,
  getAdminUsers,
  updateAdminUser,
} from "./adminUserStorage";

import type {
  AdminUser,
} from "./adminUserStorage";

function filterAdminUsers(
  users: AdminUser[],
  query?: DataAdapterQuery
) {
  if (!query) {
    return users;
  }

  return users.filter(
    (user) => {
      const matchesSearch =
        matchesSearchQuery(
          [
            user.name,
            user.email,
            user.role,
            user.status,
            user.company,
            user.department,
          ],
          query.search
        );

      const matchesCompany =
        !query.companyId ||
        user.companyId === query.companyId;

      const matchesDepartment =
        !query.departmentId ||
        user.departmentId === query.departmentId;

      const matchesStatus =
        !query.status ||
        user.status === query.status;

      const matchesRole =
        !query.role ||
        user.role === query.role;

      return (
        matchesSearch &&
        matchesCompany &&
        matchesDepartment &&
        matchesStatus &&
        matchesRole
      );
    }
  );
}

export const adminUserLocalStorageAdapter: DataAdapter<AdminUser> =
  {
    meta:
      createLocalStorageAdapterMeta(
        "adminUser",
        "dms_admin_users"
      ),

    async list(
      query?: DataAdapterQuery
    ) {
      try {
        const users =
          getAdminUsers();

        const filteredUsers =
          filterAdminUsers(
            users,
            query
          );

        return createSuccessListResult(
          applyPagination(
            filteredUsers,
            query
          )
        );
      } catch {
        return {
          success:
            false,

          data:
            [],

          error:
            "Benutzer konnten nicht geladen werden.",
        };
      }
    },

    async getById(
      id: string
    ) {
      try {
        return createSuccessResult(
          getAdminUserById(
            id
          )
        );
      } catch {
        return createErrorResult<AdminUser | null>(
          "Benutzer konnte nicht geladen werden."
        );
      }
    },

    async create(
      data
    ) {
      try {
        const user =
          createAdminUser(
            data
          );

        return createSuccessResult(
          user
        );
      } catch {
        return createErrorResult<AdminUser>(
          "Benutzer konnte nicht erstellt werden."
        );
      }
    },

    async update(
      id: string,
      data: Partial<AdminUser>
    ) {
      try {
        const user =
          updateAdminUser(
            id,
            data
          );

        return createSuccessResult(
          user
        );
      } catch {
        return createErrorResult<AdminUser | null>(
          "Benutzer konnte nicht aktualisiert werden."
        );
      }
    },

    async delete(
      id: string
    ) {
      try {
        deleteAdminUser(
          id
        );

        return createSuccessResult(
          true
        );
      } catch {
        return createErrorResult<boolean>(
          "Benutzer konnte nicht gelöscht werden."
        );
      }
    },
  };

export function getAdminUserAdapter() {
  return adminUserLocalStorageAdapter;
}