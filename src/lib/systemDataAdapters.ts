import {
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
  getAppSettings,
  saveAppSettings,
} from "./appSettingsStorage";

import type {
  AppSettings,
} from "./appSettingsStorage";

import type {
  UserRole,
} from "./userStorage";

export type SettingsAdapterEntity =
  AppSettings & {
    id: string;
    createdAt: string;
  };

export type CurrentUserAdapterEntity = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string;
  departmentId?: string;
  company?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
};

const CURRENT_USER_STORAGE_KEY =
  "dms_current_user";

function dispatchUserUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("userUpdated")
  );
}

function normalizeSettingsEntity(
  settings: AppSettings
): SettingsAdapterEntity {
  return {
    ...settings,

    id:
      "app-settings",

    createdAt:
      settings.updatedAt ||
      new Date().toLocaleString(),
  };
}

function normalizeRole(
  value: unknown
): UserRole {
  if (value === "admin") {
    return "admin";
  }

  if (value === "editor") {
    return "editor";
  }

  return "viewer";
}

function normalizeCurrentUser(
  user: Partial<CurrentUserAdapterEntity>
): CurrentUserAdapterEntity {
  const now =
    new Date().toLocaleString();

  return {
    id:
      user.id ||
      user.email ||
      "current-user",

    name:
      user.name ||
      "Unbekannt",

    email:
      user.email ||
      "",

    role:
      normalizeRole(
        user.role
      ),

    companyId:
      user.companyId ||
      "company-intern",

    departmentId:
      user.departmentId ||
      "department-it",

    company:
      user.company ||
      "Intern",

    department:
      user.department ||
      "IT",

    createdAt:
      user.createdAt ||
      now,

    updatedAt:
      user.updatedAt ||
      now,
  };
}

function getCurrentUserFromStorage(): CurrentUserAdapterEntity | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw =
    localStorage.getItem(
      CURRENT_USER_STORAGE_KEY
    );

  if (!raw) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(raw);

    return normalizeCurrentUser(
      parsed
    );
  } catch {
    return null;
  }
}

function saveCurrentUserToStorage(
  user: CurrentUserAdapterEntity
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    CURRENT_USER_STORAGE_KEY,
    JSON.stringify(
      normalizeCurrentUser(
        user
      )
    )
  );

  dispatchUserUpdated();
}

function deleteCurrentUserFromStorage() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    CURRENT_USER_STORAGE_KEY
  );

  dispatchUserUpdated();
}

function filterSettings(
  settings: SettingsAdapterEntity[],
  query?: DataAdapterQuery
) {
  if (!query) {
    return settings;
  }

  return settings.filter(
    (item) =>
      matchesSearchQuery(
        [
          item.appName,
          item.companyName,
          item.appVersion,
          item.version,
          item.theme,
          item.appAccentColor,
          item.accentColor,
          item.sidebarPosition,
          item.defaultUserRole,
        ],
        query.search
      )
  );
}

function filterCurrentUsers(
  users: CurrentUserAdapterEntity[],
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
            user.company,
            user.department,
          ],
          query.search
        );

      const matchesRole =
        !query.role ||
        user.role === query.role;

      const matchesCompany =
        !query.companyId ||
        user.companyId === query.companyId;

      const matchesDepartment =
        !query.departmentId ||
        user.departmentId === query.departmentId;

      return (
        matchesSearch &&
        matchesRole &&
        matchesCompany &&
        matchesDepartment
      );
    }
  );
}

export const settingsLocalStorageAdapter: DataAdapter<SettingsAdapterEntity> =
  {
    meta:
      createLocalStorageAdapterMeta(
        "settings",
        "dms_app_settings"
      ),

    async list(
      query?: DataAdapterQuery
    ) {
      try {
        const settings =
          normalizeSettingsEntity(
            getAppSettings()
          );

        return createSuccessListResult(
          filterSettings(
            [
              settings,
            ],
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
            "Einstellungen konnten nicht geladen werden.",
        };
      }
    },

    async getById(
      id: string
    ) {
      try {
        if (id !== "app-settings") {
          return createSuccessResult(
            null
          );
        }

        return createSuccessResult(
          normalizeSettingsEntity(
            getAppSettings()
          )
        );
      } catch {
        return createErrorResult<SettingsAdapterEntity | null>(
          "Einstellungen konnten nicht geladen werden."
        );
      }
    },

    async create(
      data
    ) {
      try {
        const savedSettings =
          saveAppSettings(
            data
          );

        return createSuccessResult(
          normalizeSettingsEntity(
            savedSettings
          )
        );
      } catch {
        return createErrorResult<SettingsAdapterEntity>(
          "Einstellungen konnten nicht erstellt werden."
        );
      }
    },

    async update(
      id: string,
      data: Partial<SettingsAdapterEntity>
    ) {
      try {
        if (id !== "app-settings") {
          return createSuccessResult(
            null
          );
        }

        const savedSettings =
          saveAppSettings(
            data
          );

        return createSuccessResult(
          normalizeSettingsEntity(
            savedSettings
          )
        );
      } catch {
        return createErrorResult<SettingsAdapterEntity | null>(
          "Einstellungen konnten nicht aktualisiert werden."
        );
      }
    },

    async delete() {
      return createErrorResult<boolean>(
        "Einstellungen können nicht gelöscht werden. Bitte Zurücksetzen verwenden."
      );
    },
  };

export const currentUserLocalStorageAdapter: DataAdapter<CurrentUserAdapterEntity> =
  {
    meta:
      createLocalStorageAdapterMeta(
        "currentUser",
        CURRENT_USER_STORAGE_KEY
      ),

    async list(
      query?: DataAdapterQuery
    ) {
      try {
        const user =
          getCurrentUserFromStorage();

        const users =
          user
            ? [
                user,
              ]
            : [];

        return createSuccessListResult(
          filterCurrentUsers(
            users,
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
            "Aktueller Benutzer konnte nicht geladen werden.",
        };
      }
    },

    async getById(
      id: string
    ) {
      try {
        const user =
          getCurrentUserFromStorage();

        if (!user) {
          return createSuccessResult(
            null
          );
        }

        if (
          user.id !== id &&
          id !== "current-user"
        ) {
          return createSuccessResult(
            null
          );
        }

        return createSuccessResult(
          user
        );
      } catch {
        return createErrorResult<CurrentUserAdapterEntity | null>(
          "Aktueller Benutzer konnte nicht geladen werden."
        );
      }
    },

        async create(
            data
) {
  try {
    const now =
      new Date().toLocaleString();

    const user =
      normalizeCurrentUser({
        ...data,

        id:
          "current-user",

        createdAt:
          now,

        updatedAt:
          now,
      });

    saveCurrentUserToStorage(
      user
    );

    return createSuccessResult(
      user
    );
  } catch {
    return createErrorResult<CurrentUserAdapterEntity>(
      "Aktueller Benutzer konnte nicht erstellt werden."
    );
  }
},

    async update(
      id: string,
      data: Partial<CurrentUserAdapterEntity>
    ) {
      try {
        const existingUser =
          getCurrentUserFromStorage();

        if (!existingUser) {
          return createSuccessResult(
            null
          );
        }

        if (
          existingUser.id !== id &&
          id !== "current-user"
        ) {
          return createSuccessResult(
            null
          );
        }

        const updatedUser =
          normalizeCurrentUser({
            ...existingUser,
            ...data,

            id:
              existingUser.id,

            createdAt:
              existingUser.createdAt,

            updatedAt:
              new Date().toLocaleString(),
          });

        saveCurrentUserToStorage(
          updatedUser
        );

        return createSuccessResult(
          updatedUser
        );
      } catch {
        return createErrorResult<CurrentUserAdapterEntity | null>(
          "Aktueller Benutzer konnte nicht aktualisiert werden."
        );
      }
    },

    async delete() {
      try {
        deleteCurrentUserFromStorage();

        return createSuccessResult(
          true
        );
      } catch {
        return createErrorResult<boolean>(
          "Aktueller Benutzer konnte nicht gelöscht werden."
        );
      }
    },
  };

export function getSettingsAdapter() {
  return settingsLocalStorageAdapter;
}

export function getCurrentUserAdapter() {
  return currentUserLocalStorageAdapter;
}