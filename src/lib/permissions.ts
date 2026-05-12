import { getUser } from "./userStorage";

export function canEdit() {
  const user = getUser();

  return (
    user?.role === "admin" ||
    user?.role === "editor"
  );
}

export function isAdmin() {
  const user = getUser();

  return user?.role === "admin";
}