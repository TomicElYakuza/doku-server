import type {
  UserRole,
} from "./userStorage";

export type AdminUserStatus =
  | "active"
  | "inactive"
  | "invited";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AdminUserStatus;

  companyId?: string;
  departmentId?: string;
  company?: string;
  department?: string;

  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
};

const STORAGE_KEY =
  "dms_admin_users";

const defaultAdminUsers: AdminUser[] = [
  {
    id:
      "admin-user-admin",

    name:
      "Admin",

    email:
      "admin@local",

    role:
      "admin",

    status:
      "active",

    companyId:
      "company-intern",

    departmentId:
      "department-it",

    company:
      "Intern",

    department:
      "IT",

    createdAt:
      new Date().toLocaleString(),

    updatedAt:
      new Date().toLocaleString(),

    lastLoginAt:
      "",
  },

  {
    id:
      "admin-user-editor",

    name:
      "Editor",

    email:
      "editor@local",

    role:
      "editor",

    status:
      "active",

    companyId:
      "company-intern",

    departmentId:
      "department-support",

    company:
      "Intern",

    department:
      "Support",

    createdAt:
      new Date().toLocaleString(),

    updatedAt:
      new Date().toLocaleString(),

    lastLoginAt:
      "",
  },

  {
    id:
      "admin-user-viewer",

    name:
      "Viewer",

    email:
      "viewer@local",

    role:
      "viewer",

    status:
      "active",

    companyId:
      "company-intern",

    departmentId:
      "department-office",

    company:
      "Intern",

    department:
      "Office",

    createdAt:
      new Date().toLocaleString(),

    updatedAt:
      new Date().toLocaleString(),

    lastLoginAt:
      "",
  },
];

function dispatchAdminUsersUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("adminUsersUpdated")
  );
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `admin-user-${crypto.randomUUID()}`;
  }

  return `admin-user-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
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

  if (value === "viewer") {
    return "viewer";
  }

  return "viewer";
}

function normalizeStatus(
  value: unknown
): AdminUserStatus {
  if (value === "active") {
    return "active";
  }

  if (value === "inactive") {
    return "inactive";
  }

  if (value === "invited") {
    return "invited";
  }

  return "active";
}

function normalizeAdminUser(
  user: Partial<AdminUser>
): AdminUser {
  const now =
    new Date().toLocaleString();

  return {
    id:
      user.id ||
      createId(),

    name:
      user.name ||
      "Unbekannter Benutzer",

    email:
      user.email ||
      "unknown@local",

    role:
      normalizeRole(
        user.role
      ),

    status:
      normalizeStatus(
        user.status
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

    lastLoginAt:
      user.lastLoginAt ||
      "",
  };
}

export function getAdminUsers(): AdminUser[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!raw) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        defaultAdminUsers
      )
    );

    return defaultAdminUsers.map(
      (user) =>
        normalizeAdminUser(
          user
        )
    );
  }

  try {
    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(
      (user) =>
        normalizeAdminUser(
          user
        )
    );
  } catch {
    return [];
  }
}

export function saveAdminUsers(
  users: AdminUser[]
) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedUsers =
    users.map(
      (user) =>
        normalizeAdminUser(
          user
        )
    );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      normalizedUsers
    )
  );

  dispatchAdminUsersUpdated();
}

export function resetAdminUsers() {
  saveAdminUsers(
    defaultAdminUsers
  );
}

export function clearAdminUsers() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );

  dispatchAdminUsersUpdated();
}

export function getAdminUserById(
  id: string
): AdminUser | null {
  return (
    getAdminUsers().find(
      (user) =>
        user.id === id
    ) || null
  );
}

export function getAdminUserByEmail(
  email: string
): AdminUser | null {
  const normalizedEmail =
    email
      .trim()
      .toLowerCase();

  return (
    getAdminUsers().find(
      (user) =>
        user.email
          .trim()
          .toLowerCase() === normalizedEmail
    ) || null
  );
}

export function createAdminUser(
  user: Omit<
    AdminUser,
    "id" | "createdAt" | "updatedAt"
  >
): AdminUser {
  const users =
    getAdminUsers();

  const now =
    new Date().toLocaleString();

  const newUser =
    normalizeAdminUser({
      ...user,

      id:
        createId(),

      createdAt:
        now,

      updatedAt:
        now,
    });

  saveAdminUsers([
    newUser,
    ...users,
  ]);

  return newUser;
}

export function updateAdminUser(
  id: string,
  updates: Partial<AdminUser>
): AdminUser | null {
  const users =
    getAdminUsers();

  let updatedUser:
    | AdminUser
    | null = null;

  const updatedUsers =
    users.map(
      (user) => {
        if (user.id !== id) {
          return user;
        }

        const nextUser =
          normalizeAdminUser({
            ...user,
            ...updates,

            id:
              user.id,

            createdAt:
              user.createdAt,

            updatedAt:
              new Date().toLocaleString(),
          });

        updatedUser =
          nextUser;

        return nextUser;
      }
    );

  saveAdminUsers(
    updatedUsers
  );

  return updatedUser;
}

export function deleteAdminUser(
  id: string
) {
  const users =
    getAdminUsers();

  saveAdminUsers(
    users.filter(
      (user) =>
        user.id !== id
    )
  );
}

export function updateAdminUserLastLogin(
  email: string
): AdminUser | null {
  const user =
    getAdminUserByEmail(
      email
    );

  if (!user) {
    return null;
  }

  return updateAdminUser(
    user.id,
    {
      lastLoginAt:
        new Date().toLocaleString(),
    }
  );
}

export function getAdminUsersByCompanyId(
  companyId: string
) {
  return getAdminUsers().filter(
    (user) =>
      user.companyId === companyId
  );
}

export function getAdminUsersByDepartmentId(
  departmentId: string
) {
  return getAdminUsers().filter(
    (user) =>
      user.departmentId === departmentId
  );
}

export function getAdminUsersByStatus(
  status: AdminUserStatus
) {
  return getAdminUsers().filter(
    (user) =>
      user.status === status
  );
}

export function getAdminUsersByRole(
  role: UserRole
) {
  return getAdminUsers().filter(
    (user) =>
      user.role === role
  );
}

export function getAdminUserRoleLabel(
  role: UserRole | string
) {
  if (role === "admin") {
    return "Administrator";
  }

  if (role === "editor") {
    return "Bearbeiter";
  }

  if (role === "viewer") {
    return "Leser";
  }

  return "Unbekannt";
}

export function getAdminUserRoleClass(
  role: UserRole | string
) {
  if (role === "admin") {
    return "bg-red-50 text-red-700";
  }

  if (role === "editor") {
    return "bg-indigo-50 text-indigo-700";
  }

  if (role === "viewer") {
    return "bg-zinc-100 text-zinc-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

export function getAdminUserStatusLabel(
  status: AdminUserStatus | string
) {
  if (status === "active") {
    return "Aktiv";
  }

  if (status === "inactive") {
    return "Inaktiv";
  }

  if (status === "invited") {
    return "Eingeladen";
  }

  return "Unbekannt";
}

export function getAdminUserStatusClass(
  status: AdminUserStatus | string
) {
  if (status === "active") {
    return "bg-green-50 text-green-700";
  }

  if (status === "inactive") {
    return "bg-zinc-100 text-zinc-700";
  }

  if (status === "invited") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

/**
 * Alte Alias-Namen, falls ältere Seiten sie noch importieren.
 */
export function getUserStatusLabel(
  status: AdminUserStatus | string
) {
  return getAdminUserStatusLabel(
    status
  );
}

export function getUserStatusClass(
  status: AdminUserStatus | string
) {
  return getAdminUserStatusClass(
    status
  );
}

export function getUserRoleLabel(
  role: UserRole | string
) {
  return getAdminUserRoleLabel(
    role
  );
}

export function getUserRoleClass(
  role: UserRole | string
) {
  return getAdminUserRoleClass(
    role
  );
}