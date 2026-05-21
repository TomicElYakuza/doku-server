import {
  requestJson,
} from "./apiClient";

import type {
  User,
} from "../types/user";

type CurrentUserResponse = {
  user: User | null;
};

let cachedCurrentUser:
  | User
  | null =
  null;

function dispatchCurrentUserUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(
      "currentUserUpdated"
    )
  );
}

export function getCachedCurrentUser() {
  return cachedCurrentUser;
}

export function getCachedCurrentUserRole() {
  return (
    cachedCurrentUser?.role ||
    "viewer"
  );
}

export async function loadCurrentUser() {
  const response =
    await requestJson<CurrentUserResponse>(
      "/api/auth/current-user"
    );

  cachedCurrentUser =
    response.user;

  dispatchCurrentUserUpdated();

  return cachedCurrentUser;
}

export async function loginCurrentUser(
  email: string
) {
  const response =
    await requestJson<CurrentUserResponse>(
      "/api/auth/login",
      {
        method:
          "POST",

        body:
          JSON.stringify({
            email,
          }),
      }
    );

  cachedCurrentUser =
    response.user;

  dispatchCurrentUserUpdated();

  return cachedCurrentUser;
}

export async function logoutCurrentUser() {
  await requestJson<{
    ok: boolean;
  }>(
    "/api/auth/logout",
    {
      method:
        "POST",
    }
  );

  cachedCurrentUser =
    null;

  dispatchCurrentUserUpdated();
}