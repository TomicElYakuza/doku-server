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
  company: string;
  department: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
};

const STORAGE_KEY =
  "dms_admin_users";

const defaultAdminUsers: AdminUser[] = [
  {
    id:
      "user-admin-demo",

    name:
      "Admin",

    email:
      "admin@local",

    role:
      "admin",

    status:
      "active",

    company:
      "Intern",

    department:
      "IT",

    createdAt:
      new Date().toLocaleString(),

    updatedAt:
      new Date().toLocaleString(),

    lastLoginAt:
      new Date().toLocaleString(),
  },

  {
    id:
      "user-editor-demo",

    name:
      "Editor",

    email:
      "editor@local",

    role:
      "editor",

    status:
      "active",

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
      "user-viewer-demo",

    name:
      "Viewer",

    email:
      "viewer@local",

    role:
      "viewer",

    status:
      "invited",

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
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
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
      "Unbekannt",

    email:
      user.email ||
      "user@local",

    role:
      normalizeRole(
        user.role
      ),

    status:
      normalizeStatus(
        user.status
      ),

    company:
      user.company ||
      "Intern",

    department:
      user.department ||
      "Allgemein",

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

    return defaultAdminUsers;
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

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      users
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
  const users =
    getAdminUsers();

  return (
    users.find(
      (user) =>
        user.id === id
    ) || null
  );
}

export function getAdminUserByEmail(
  email: string
): AdminUser | null {
  const users =
    getAdminUsers();

  const normalizedEmail =
    email.trim().toLowerCase();

  return (
    users.find(
      (user) =>
        user.email
          .trim()
          .toLowerCase() ===
        normalizedEmail
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

  const existingUser =
    getAdminUserByEmail(
      user.email
    );

  if (existingUser) {
    return existingUser;
  }

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

  const updatedUsers =
    users.filter(
      (user) =>
        user.id !== id
    );

  saveAdminUsers(
    updatedUsers
  );
}

export function activateAdminUser(
  id: string
) {
  return updateAdminUser(
    id,
    {
      status:
        "active",
    }
  );
}

export function deactivateAdminUser(
  id: string
) {
  return updateAdminUser(
    id,
    {
      status:
        "inactive",
    }
  );
}

export function markAdminUserInvited(
  id: string
) {
  return updateAdminUser(
    id,
    {
      status:
        "invited",
    }
  );
}

export function updateAdminUserLastLogin(
  email: string
) {
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