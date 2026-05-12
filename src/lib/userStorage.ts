const STORAGE_KEY = "wiki-user";

export function getUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const data =
    localStorage.getItem(STORAGE_KEY);

  return data
    ? JSON.parse(data)
    : null;
}

export function saveUser(
  user: any
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(user)
  );
}