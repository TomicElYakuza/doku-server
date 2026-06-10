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


const CURRENT_USER_CACHE_TIME_MS = 30_000;

let cachedCurrentUserAt = 0;
let loadCurrentUserPromise: Promise<User | null> | null = null;

function isCurrentUserCacheValid() {
  return Boolean(cachedCurrentUser) && Date.now() - cachedCurrentUserAt < CURRENT_USER_CACHE_TIME_MS;
}
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
  cachedCurrentUserAt = Date.now();
  cachedCurrentUser =
    user;

  dispatchCurrentUserUpdated();
}

export async function loadCurrentUser(options?: { force?: boolean }) {
  if (!options?.force && isCurrentUserCacheValid()) {
    return cachedCurrentUser;
  }

  if (!options?.force && loadCurrentUserPromise) {
    return loadCurrentUserPromise;
  }

  loadCurrentUserPromise = fetch("/api/auth/current-user", {
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) {
        cachedCurrentUserAt = Date.now();
  cachedCurrentUser = null;
        cachedCurrentUserAt = Date.now();
        dispatchCurrentUserUpdated();
        return null;
      }

      const body = await response.json();
      cachedCurrentUserAt = Date.now();
  cachedCurrentUser = body.user || null;
      cachedCurrentUserAt = Date.now();
      dispatchCurrentUserUpdated();

      return cachedCurrentUser;
    })
    .catch((error) => {
      console.error(error);
      cachedCurrentUserAt = Date.now();
  cachedCurrentUser = null;
      cachedCurrentUserAt = Date.now();
      dispatchCurrentUserUpdated();

      return null;
    })
    .finally(() => {
      loadCurrentUserPromise = null;
    });

  return loadCurrentUserPromise;
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

  cachedCurrentUserAt = Date.now();
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
    cachedCurrentUserAt = Date.now();
  cachedCurrentUser =
      null;

    dispatchCurrentUserUpdated();
  }
}

export function clearCurrentUserCache() {
  cachedCurrentUserAt = Date.now();
  cachedCurrentUser =
    null;

  dispatchCurrentUserUpdated();
}
