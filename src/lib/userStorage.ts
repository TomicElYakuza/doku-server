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
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveUser(user: any) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(user)
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