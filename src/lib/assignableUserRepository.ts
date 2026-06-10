export type AssignableUser = {
  id: string;
  name: string;
  email: string;
};

const CACHE_TIME_MS = 30_000;

let usersCache: AssignableUser[] | null = null;
let usersCacheAt = 0;
let usersPromise: Promise<AssignableUser[]> | null = null;

async function parseResponse<T>(response: Response, fallbackMessage: string) {
  if (!response.ok) {
    let message = fallbackMessage;

    try {
      const body = await response.json();
      message = body.message || body.error || fallbackMessage;
    } catch {
      // ignore parse error
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

function isCacheValid() {
  return Boolean(usersCache) && Date.now() - usersCacheAt < CACHE_TIME_MS;
}

export const assignableUserRepository = {
  async list(options?: { force?: boolean }) {
    if (!options?.force && isCacheValid()) {
      return usersCache || [];
    }

    if (!options?.force && usersPromise) {
      return usersPromise;
    }

    usersPromise = fetch("/api/assignable-users", {
      cache: "no-store",
    })
      .then((response) =>
        parseResponse<AssignableUser[]>(
          response,
          "Zuweisbare Benutzer konnten nicht geladen werden.",
        ),
      )
      .then((users) => {
        usersCache = Array.isArray(users) ? users : [];
        usersCacheAt = Date.now();

        return usersCache;
      })
      .finally(() => {
        usersPromise = null;
      });

    return usersPromise;
  },

  clearCache() {
    usersCache = null;
    usersCacheAt = 0;
    usersPromise = null;
  },
};