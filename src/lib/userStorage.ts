export type UserRole =
  | "admin"
  | "editor"
  | "viewer";

export type User = {
  name: string;
  email: string;
  role: UserRole;

  companyId?: string;
  departmentId?: string;

  company?: string;
  department?: string;
};

const STORAGE_KEY =
  "dms_user";

export const defaultUser: User = {
  name:
    "Admin",

  email:
    "admin@local",

  role:
    "admin",

  companyId:
    "company-intern",

  departmentId:
    "department-it",

  company:
    "Intern",

  department:
    "IT",
};

function dispatchUserUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("userUpdated")
  );
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

function normalizeUser(
  user: Partial<User>
): User {
  return {
    name:
      user.name ||
      defaultUser.name,

    email:
      user.email ||
      defaultUser.email,

    role:
      normalizeRole(
        user.role
      ),

    companyId:
      user.companyId ||
      defaultUser.companyId,

    departmentId:
      user.departmentId ||
      defaultUser.departmentId,

    company:
      user.company ||
      defaultUser.company,

    department:
      user.department ||
      defaultUser.department,
  };
}

export function getUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!raw) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        defaultUser
      )
    );

    return defaultUser;
  }

  try {
    const parsed =
      JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return defaultUser;
    }

    return normalizeUser(
      parsed
    );
  } catch {
    return defaultUser;
  }
}

export function getUserRole(): UserRole {
  const user =
    getUser();

  return normalizeRole(
    user?.role
  );
}

export function saveUser(
  user: User
): User {
  if (typeof window === "undefined") {
    return normalizeUser(
      user
    );
  }

  const normalizedUser =
    normalizeUser(
      user
    );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      normalizedUser
    )
  );

  dispatchUserUpdated();

  return normalizedUser;
}

export function updateUser(
  updates: Partial<User>
): User {
  const currentUser =
    getUser() ||
    defaultUser;

  return saveUser({
    ...currentUser,
    ...updates,
  });
}

export function resetUser(): User {
  return saveUser(
    defaultUser
  );
}

export function clearUser() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );

  dispatchUserUpdated();
}

export function getRoleLabel(
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

export function isAdminUser(
  user?: User | null
) {
  return user?.role === "admin";
}

export function isEditorUser(
  user?: User | null
) {
  return user?.role === "editor";
}

export function isViewerUser(
  user?: User | null
) {
  return user?.role === "viewer";
}