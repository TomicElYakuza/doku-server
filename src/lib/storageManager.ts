export type StorageArea =
  | "wiki"
  | "tickets"
  | "ticketComments"
  | "ticketTemplates"
  | "activities"
  | "users"
  | "companies"
  | "departments"
  | "settings"
  | "currentUser"
  | "notifications";

export type StorageEntry = {
  key: string;
  label: string;
  area: StorageArea;
};

export type StorageInfo = StorageEntry & {
  exists: boolean;
  size: number;
  itemCount: number;
  updatedAt: string;
};

export type StorageExport = {
  exportedAt: string;
  version: string;
  items: Record<string, unknown>;
};

export const storageEntries: StorageEntry[] = [
  {
    key: "dms_wiki_pages",
    label: "Wiki-Seiten",
    area: "wiki",
  },
  {
    key: "dms_tickets",
    label: "Tickets",
    area: "tickets",
  },
  {
    key: "dms_ticket_comments",
    label: "Ticket-Kommentare",
    area: "ticketComments",
  },
  {
    key: "dms_ticket_templates",
    label: "Ticket-Vorlagen",
    area: "ticketTemplates",
  },
  {
    key: "dms_activities",
    label: "Aktivitäten",
    area: "activities",
  },
  {
    key: "dms_admin_users",
    label: "Admin-Benutzer",
    area: "users",
  },
  {
    key: "dms_companies",
    label: "Firmen",
    area: "companies",
  },
  {
    key: "dms_departments",
    label: "Abteilungen",
    area: "departments",
  },
  {
    key: "dms_app_settings",
    label: "App-Einstellungen",
    area: "settings",
  },
  {
    key: "dms_current_user",
    label: "Aktueller Benutzer",
    area: "currentUser",
  },
  {
    key: "dms_notifications",
    label: "Benachrichtigungen",
    area: "notifications",
  },
];

function dispatchStorageUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("storageManagerUpdated")
  );
}

function dispatchKnownEvents() {
  if (typeof window === "undefined") {
    return;
  }

  const events = [
    "wikiPagesUpdated",
    "ticketsUpdated",
    "ticketCommentsUpdated",
    "ticketTemplatesUpdated",
    "activityUpdated",
    "adminUsersUpdated",
    "companiesUpdated",
    "departmentsUpdated",
    "appSettingsUpdated",
    "userUpdated",
    "notificationsUpdated",
    "dataUpdated",
  ];

  events.forEach(
    (eventName) => {
      window.dispatchEvent(
        new Event(eventName)
      );
    }
  );
}

function getRawValue(
  key: string
) {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(
    key
  );
}

function parseValue(
  value: string | null
): unknown {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(
      value
    );
  } catch {
    return value;
  }
}

function getItemCountFromValue(
  value: unknown
) {
  if (Array.isArray(value)) {
    return value.length;
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return Object.keys(
      value
    ).length;
  }

  if (
    typeof value === "string" &&
    value.length > 0
  ) {
    return 1;
  }

  return 0;
}

function getSizeFromRawValue(
  value: string | null
) {
  if (!value) {
    return 0;
  }

  return new Blob([
    value,
  ]).size;
}

export function getStorageInfo(): StorageInfo[] {
  if (typeof window === "undefined") {
    return storageEntries.map(
      (entry) => ({
        ...entry,

        exists:
          false,

        size:
          0,

        itemCount:
          0,

        updatedAt:
          "",
      })
    );
  }

  return storageEntries.map(
    (entry) => {
      const rawValue =
        getRawValue(
          entry.key
        );

      const parsedValue =
        parseValue(
          rawValue
        );

      return {
        ...entry,

        exists:
          rawValue !== null,

        size:
          getSizeFromRawValue(
            rawValue
          ),

        itemCount:
          getItemCountFromValue(
            parsedValue
          ),

        updatedAt:
          rawValue
            ? new Date().toLocaleString()
            : "",
      };
    }
  );
}

export function getStorageEntry(
  key: string
): StorageInfo | null {
  return (
    getStorageInfo().find(
      (entry) =>
        entry.key === key
    ) || null
  );
}

export function getStorageValue(
  key: string
): unknown {
  return parseValue(
    getRawValue(
      key
    )
  );
}

export function clearStorageKey(
  key: string
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    key
  );

  dispatchStorageUpdated();
  dispatchKnownEvents();
}

export function clearStorageArea(
  area: StorageArea
) {
  if (typeof window === "undefined") {
    return;
  }

  storageEntries
    .filter(
      (entry) =>
        entry.area === area
    )
    .forEach(
      (entry) => {
        localStorage.removeItem(
          entry.key
        );
      }
    );

  dispatchStorageUpdated();
  dispatchKnownEvents();
}

export function clearAllDmsStorage() {
  if (typeof window === "undefined") {
    return;
  }

  storageEntries.forEach(
    (entry) => {
      localStorage.removeItem(
        entry.key
      );
    }
  );

  dispatchStorageUpdated();
  dispatchKnownEvents();
}

export function exportStorage(): StorageExport {
  const items: Record<string, unknown> =
    {};

  if (typeof window !== "undefined") {
    storageEntries.forEach(
      (entry) => {
        items[entry.key] =
          getStorageValue(
            entry.key
          );
      }
    );
  }

  return {
    exportedAt:
      new Date().toLocaleString(),

    version:
      "1.0",

    items,
  };
}

export function exportStorageAsJson() {
  return JSON.stringify(
    exportStorage(),
    null,
    2
  );
}

export function downloadStorageExport() {
  if (typeof window === "undefined") {
    return;
  }

  const json =
    exportStorageAsJson();

  const blob =
    new Blob(
      [
        json,
      ],
      {
        type: "application/json",
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href =
    url;

  link.download =
    `dms-export-${Date.now()}.json`;

  document.body.appendChild(
    link
  );

  link.click();

  document.body.removeChild(
    link
  );

  URL.revokeObjectURL(
    url
  );
}

export function importStorageFromObject(
  data: StorageExport
) {
  if (typeof window === "undefined") {
    return;
  }

  if (
    !data ||
    typeof data !== "object" ||
    !data.items ||
    typeof data.items !== "object"
  ) {
    throw new Error(
      "Ungültige Import-Datei."
    );
  }

  storageEntries.forEach(
    (entry) => {
      if (
        Object.prototype.hasOwnProperty.call(
          data.items,
          entry.key
        )
      ) {
        const value =
          data.items[
            entry.key
          ];

        if (
          value === null ||
          typeof value === "undefined"
        ) {
          localStorage.removeItem(
            entry.key
          );

          return;
        }

        localStorage.setItem(
          entry.key,
          JSON.stringify(
            value
          )
        );
      }
    }
  );

  dispatchStorageUpdated();
  dispatchKnownEvents();
}

export async function importStorageFromFile(
  file: File
) {
  const text =
    await file.text();

  const parsed =
    JSON.parse(
      text
    ) as StorageExport;

  importStorageFromObject(
    parsed
  );
}

export function formatStorageSize(
  size: number
) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function getTotalStorageSize() {
  return getStorageInfo().reduce(
    (sum, item) =>
      sum + item.size,
    0
  );
}

export function getTotalStorageItemCount() {
  return getStorageInfo().reduce(
    (sum, item) =>
      sum + item.itemCount,
    0
  );
}