const STORAGE_KEY = "wiki-user";

export function getUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const data =
    localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return null;
  }

  try {
    const parsed = JSON.parse(data);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveUser(user: any) {
  if (typeof window === "undefined") {
    return;
  }

  if (
    !user ||
    typeof user !== "object" ||
    Array.isArray(user)
  ) {
    return;
  }

  const safeUser = {
    name:
      user.name || "Unbekannt",

    role:
      user.role || "viewer",

    updatedAt:
      user.updatedAt ||
      new Date().toLocaleString(),
  };

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(safeUser)
  );

  window.dispatchEvent(
    new Event("userUpdated")
  );
}

export function clearUser() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );

  window.dispatchEvent(
    new Event("userUpdated")
  );
}