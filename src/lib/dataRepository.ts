export type RepositoryEventName =
  | "ticketsUpdated"
  | "ticketTemplatesUpdated"
  | "ticketCommentsUpdated"
  | "activityUpdated"
  | "wikiPagesUpdated"
  | "trashUpdated"
  | "userUpdated"
  | "adminUsersUpdated"
  | "companiesUpdated"
  | "departmentsUpdated"
  | "appSettingsUpdated"
  | "filesUpdated";

export type RepositoryMode =
  | "localStorage"
  | "database";

export type RepositoryResult<T> = {
  success: boolean;
  data: T;
  mode: RepositoryMode;
  error?: string;
};

export type RepositoryMeta = {
  storageKey: string;
  eventName?: RepositoryEventName;
  label: string;
};

export const REPOSITORY_KEYS = {
  tickets: {
    storageKey: "dms_tickets",
    eventName: "ticketsUpdated",
    label: "Tickets",
  },

  ticketTemplates: {
    storageKey: "dms_ticket_templates",
    eventName: "ticketTemplatesUpdated",
    label: "Ticket-Vorlagen",
  },

  ticketComments: {
    storageKey: "dms_ticket_comments",
    eventName: "ticketCommentsUpdated",
    label: "Ticket-Kommentare",
  },

  activities: {
    storageKey: "dms_activities",
    eventName: "activityUpdated",
    label: "Aktivitäten",
  },

  wikiPages: {
    storageKey: "dms_wiki_pages",
    eventName: "wikiPagesUpdated",
    label: "Wiki-Dokumente",
  },

  trashPages: {
    storageKey: "dms_trash_pages",
    eventName: "trashUpdated",
    label: "Papierkorb",
  },

  files: {
    storageKey: "dms_files",
    eventName: "filesUpdated",
    label: "Dateien",
  },

  user: {
    storageKey: "dms_user",
    eventName: "userUpdated",
    label: "Aktueller Benutzer",
  },

  adminUsers: {
    storageKey: "dms_admin_users",
    eventName: "adminUsersUpdated",
    label: "Admin-Benutzer",
  },

  companies: {
    storageKey: "dms_companies",
    eventName: "companiesUpdated",
    label: "Firmen",
  },

  departments: {
    storageKey: "dms_departments",
    eventName: "departmentsUpdated",
    label: "Abteilungen",
  },

  appSettings: {
    storageKey: "dms_app_settings",
    eventName: "appSettingsUpdated",
    label: "App-Einstellungen",
  },
} satisfies Record<string, RepositoryMeta>;

function isBrowser() {
  return typeof window !== "undefined";
}

export function getRepositoryMode(): RepositoryMode {
  return "localStorage";
}

export function dispatchRepositoryEvent(
  eventName?: RepositoryEventName
) {
  if (!isBrowser()) {
    return;
  }

  if (!eventName) {
    return;
  }

  window.dispatchEvent(
    new Event(eventName)
  );
}

export function dispatchAllRepositoryEvents() {
  if (!isBrowser()) {
    return;
  }

  Object.values(
    REPOSITORY_KEYS
  ).forEach(
    (meta) => {
      dispatchRepositoryEvent(
        meta.eventName
      );
    }
  );
}

export function readRepositoryValue<T>(
  meta: RepositoryMeta,
  fallback: T
): RepositoryResult<T> {
  if (!isBrowser()) {
    return {
      success: true,
      data: fallback,
      mode: getRepositoryMode(),
    };
  }

  const raw =
    localStorage.getItem(
      meta.storageKey
    );

  if (!raw) {
    return {
      success: true,
      data: fallback,
      mode: getRepositoryMode(),
    };
  }

  try {
    const parsed =
      JSON.parse(raw) as T;

    return {
      success: true,
      data: parsed,
      mode: getRepositoryMode(),
    };
  } catch {
    return {
      success: false,
      data: fallback,
      mode: getRepositoryMode(),
      error:
        "Gespeicherte Daten konnten nicht gelesen werden.",
    };
  }
}

export function writeRepositoryValue<T>(
  meta: RepositoryMeta,
  value: T
): RepositoryResult<T> {
  if (!isBrowser()) {
    return {
      success: true,
      data: value,
      mode: getRepositoryMode(),
    };
  }

  try {
    localStorage.setItem(
      meta.storageKey,
      JSON.stringify(
        value
      )
    );

    dispatchRepositoryEvent(
      meta.eventName
    );

    return {
      success: true,
      data: value,
      mode: getRepositoryMode(),
    };
  } catch {
    return {
      success: false,
      data: value,
      mode: getRepositoryMode(),
      error:
        "Daten konnten nicht gespeichert werden.",
    };
  }
}

export function removeRepositoryValue(
  meta: RepositoryMeta
): RepositoryResult<null> {
  if (!isBrowser()) {
    return {
      success: true,
      data: null,
      mode: getRepositoryMode(),
    };
  }

  try {
    localStorage.removeItem(
      meta.storageKey
    );

    dispatchRepositoryEvent(
      meta.eventName
    );

    return {
      success: true,
      data: null,
      mode: getRepositoryMode(),
    };
  } catch {
    return {
      success: false,
      data: null,
      mode: getRepositoryMode(),
      error:
        "Daten konnten nicht gelöscht werden.",
    };
  }
}

export function ensureRepositoryValue<T>(
  meta: RepositoryMeta,
  fallback: T
): RepositoryResult<T> {
  if (!isBrowser()) {
    return {
      success: true,
      data: fallback,
      mode: getRepositoryMode(),
    };
  }

  const raw =
    localStorage.getItem(
      meta.storageKey
    );

  if (raw) {
    return readRepositoryValue(
      meta,
      fallback
    );
  }

  return writeRepositoryValue(
    meta,
    fallback
  );
}

export function getRepositoryItemCount(
  meta: RepositoryMeta
) {
  if (!isBrowser()) {
    return 0;
  }

  const raw =
    localStorage.getItem(
      meta.storageKey
    );

  if (!raw) {
    return 0;
  }

  try {
    const parsed =
      JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed.length;
    }

    if (
      parsed &&
      typeof parsed === "object"
    ) {
      return Object.values(
        parsed
      ).reduce(
        (
          sum: number,
          value: any
        ) => {
          if (Array.isArray(value)) {
            return sum + value.length;
          }

          return sum + 1;
        },
        0
      );
    }

    return 1;
  } catch {
    return 0;
  }
}

export function getRepositoryStorageSize(
  meta: RepositoryMeta
) {
  if (!isBrowser()) {
    return 0;
  }

  const raw =
    localStorage.getItem(
      meta.storageKey
    );

  return raw?.length || 0;
}

export function getRepositoryOverview() {
  return Object.entries(
    REPOSITORY_KEYS
  ).map(
    ([key, meta]) => {
      const size =
        getRepositoryStorageSize(
          meta
        );

      return {
        key,
        storageKey:
          meta.storageKey,

        label:
          meta.label,

        eventName:
          meta.eventName,

        count:
          getRepositoryItemCount(
            meta
          ),

        size,

        sizeLabel:
          formatBytes(
            size
          ),

        mode:
          getRepositoryMode(),
      };
    }
  );
}

export function clearRepositoryByKey(
  key: keyof typeof REPOSITORY_KEYS
) {
  const meta =
    REPOSITORY_KEYS[key];

  return removeRepositoryValue(
    meta
  );
}

export function clearAllRepositoryData() {
  if (!isBrowser()) {
    return {
      success: true,
      data: null,
      mode: getRepositoryMode(),
    } satisfies RepositoryResult<null>;
  }

  try {
    Object.values(
      REPOSITORY_KEYS
    ).forEach(
      (meta) => {
        localStorage.removeItem(
          meta.storageKey
        );
      }
    );

    dispatchAllRepositoryEvents();

    return {
      success: true,
      data: null,
      mode: getRepositoryMode(),
    } satisfies RepositoryResult<null>;
  } catch {
    return {
      success: false,
      data: null,
      mode: getRepositoryMode(),
      error:
        "Lokale Daten konnten nicht vollständig gelöscht werden.",
    } satisfies RepositoryResult<null>;
  }
}

export function exportRepositoryData() {
  if (!isBrowser()) {
    return {};
  }

  const data: Record<string, string> =
    {};

  Object.values(
    REPOSITORY_KEYS
  ).forEach(
    (meta) => {
      const value =
        localStorage.getItem(
          meta.storageKey
        );

      if (value !== null) {
        data[meta.storageKey] =
          value;
      }
    }
  );

  return data;
}

export function importRepositoryData(
  data: Record<string, string>
) {
  if (!isBrowser()) {
    return {
      success: true,
      data: null,
      mode: getRepositoryMode(),
    } satisfies RepositoryResult<null>;
  }

  try {
    const allowedKeys =
      Object.values(
        REPOSITORY_KEYS
      ).map(
        (meta) =>
          meta.storageKey
      );

    Object.entries(
      data
    ).forEach(
      ([key, value]) => {
        if (
          allowedKeys.includes(
            key
          )
        ) {
          localStorage.setItem(
            key,
            String(value)
          );
        }
      }
    );

    dispatchAllRepositoryEvents();

    return {
      success: true,
      data: null,
      mode: getRepositoryMode(),
    } satisfies RepositoryResult<null>;
  } catch {
    return {
      success: false,
      data: null,
      mode: getRepositoryMode(),
      error:
        "Import konnte nicht abgeschlossen werden.",
    } satisfies RepositoryResult<null>;
  }
}

export function formatBytes(
  bytes: number
) {
  if (!bytes) {
    return "0 B";
  }

  const kb =
    bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(
      1
    )} KB`;
  }

  return `${(kb / 1024).toFixed(
    2
  )} MB`;
}

export function createRepositoryId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}