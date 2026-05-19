export type UserRole =
  | "admin"
  | "editor"
  | "viewer";

export type User = {
  name: string;
  email: string;
  role: UserRole;
};

const STORAGE_KEY =
  "dms_user";

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

  return "admin";
}

function normalizeUser(
  user: Partial<User>
): User {
  return {
    name:
      user.name ||
      "Admin",

    email:
      user.email ||
      "admin@local",

    role:
      normalizeRole(
        user.role
      ),
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
    const defaultUser =
      normalizeUser({
        name: "Admin",
        email: "admin@local",
        role: "admin",
      });

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
      return null;
    }

    return normalizeUser(
      parsed
    );
  } catch {
    return null;
  }
}

export function saveUser(
  user: User
) {
  if (typeof window === "undefined") {
    return;
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
) {
  const currentUser =
    getUser();

  const updatedUser =
    normalizeUser({
      ...(currentUser || {}),
      ...updates,
    });

  saveUser(
    updatedUser
  );

  return updatedUser;
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

export function getUserRole(): UserRole {
  const user =
    getUser();

  return user?.role || "admin";
}

export function isAdmin() {
  return getUserRole() === "admin";
}

export function isEditor() {
  const role =
    getUserRole();

  return (
    role === "admin" ||
    role === "editor"
  );
}

export function isViewer() {
  return getUserRole() === "viewer";
}