import type {
  User,
} from "../types/user";

let cachedCurrentUser: User | null =
  null;

type LoginInput = {
  username: string;
  password: string;
};

type LoginResponse = {
  user: User;
};

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

async function requestJson<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response =
    await fetch(
      url,
      {
        ...options,

        headers: {
          "Content-Type":
            "application/json",

          ...(options?.headers || {}),
        },
      }
    );

  const data =
    await response.json().catch(
      () => ({})
    );

  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : "Anfrage fehlgeschlagen.";

    throw new Error(
      message
    );
  }

  return data as T;
}

export function getCachedCurrentUser() {
  return cachedCurrentUser;
}

export function setCachedCurrentUser(
  user: User | null
) {
  cachedCurrentUser =
    user;

  dispatchCurrentUserUpdated();
}

export async function loadCurrentUser() {
  try {
    const data =
      await requestJson<{
        user: User | null;
      }>(
        "/api/auth/current-user",
        {
          method:
            "GET",
        }
      );

    cachedCurrentUser =
      data.user;

    dispatchCurrentUserUpdated();

    return cachedCurrentUser;
  } catch (error) {
    cachedCurrentUser =
      null;

    dispatchCurrentUserUpdated();

    return null;
  }
}

export async function loginCurrentUser(
  input: LoginInput
) {
  const username =
    input.username.trim();

  const password =
    input.password;

  if (!username) {
    throw new Error(
      "Benutzername ist erforderlich."
    );
  }

  if (!password) {
    throw new Error(
      "Passwort ist erforderlich."
    );
  }

  const data =
    await requestJson<LoginResponse>(
      "/api/auth/login",
      {
        method:
          "POST",

        body:
          JSON.stringify({
            username,
            password,
          }),
      }
    );

  cachedCurrentUser =
    data.user;

  dispatchCurrentUserUpdated();

  return cachedCurrentUser;
}

export async function logoutCurrentUser() {
  try {
    await requestJson<{
      ok: boolean;
    }>(
      "/api/auth/logout",
      {
        method:
          "POST",
        body:
          JSON.stringify({}),
      }
    );
  } finally {
    cachedCurrentUser =
      null;

    dispatchCurrentUserUpdated();
  }
}

export function clearCurrentUserCache() {
  cachedCurrentUser =
    null;

  dispatchCurrentUserUpdated();
}
