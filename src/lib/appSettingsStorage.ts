import type {
  UserRole,
} from "./userStorage";

export type AppTheme =
  | "modern"
  | "light"
  | "dark"
  | "system";

export type SidebarPosition =
  | "left"
  | "right";

export type AppAccentColor =
  | "zinc"
  | "blue"
  | "indigo"
  | "emerald"
  | "amber"
  | "red"
  | "orange";

export type AppSettings = {
  appName: string;
  companyName: string;
  appVersion: string;
  version: string;
  theme: AppTheme;
  darkMode: boolean;
  appAccentColor: AppAccentColor;
  accentColor: AppAccentColor;
  sidebarPosition: SidebarPosition;
  showVersion: boolean;
  compactMode: boolean;
  showDemoHints: boolean;
  enableTicketTemplates: boolean;
  enableTicketComments: boolean;
  enableActivityLog: boolean;
  defaultUserRole: UserRole;
  updatedAt: string;
};

const STORAGE_KEY =
  "dms_app_settings";

const defaultSettings: AppSettings = {
  appName:
    "Intranet",

  companyName:
    "Intern",

  appVersion:
    "0.1.0",

  version:
    "0.1.0",

  theme:
    "modern",

  darkMode:
    false,

  appAccentColor:
    "zinc",

  accentColor:
    "zinc",

  sidebarPosition:
    "left",

  showVersion:
    true,

  compactMode:
    false,

  showDemoHints:
    true,

  enableTicketTemplates:
    true,

  enableTicketComments:
    true,

  enableActivityLog:
    true,

  defaultUserRole:
    "viewer",

  updatedAt:
    new Date().toLocaleString(),
};

function dispatchAppSettingsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("appSettingsUpdated")
  );

  window.dispatchEvent(
    new Event("dataUpdated")
  );
}

function normalizeTheme(
  value: unknown
): AppTheme {
  if (value === "light") {
    return "light";
  }

  if (value === "dark") {
    return "dark";
  }

  return "modern";
}

function normalizeSidebarPosition(
  value: unknown
): SidebarPosition {
  if (value === "right") {
    return "right";
  }

  return "left";
}

function normalizeAccentColor(
  value: unknown
): AppAccentColor {
  if (value === "blue") {
    return "blue";
  }

  if (value === "indigo") {
    return "indigo";
  }

  if (value === "emerald") {
    return "emerald";
  }

  if (value === "amber") {
    return "amber";
  }

  if (value === "red") {
    return "red";
  }

  if (value === "orange") {
    return "orange";
  }

  return "zinc";
}

function normalizeDefaultUserRole(
  value: unknown
): UserRole {
  if (value === "admin") {
    return "admin";
  }

  if (value === "editor") {
    return "editor";
  }

  return "viewer";
}

function normalizeBoolean(
  value: unknown,
  fallback: boolean
) {
  if (typeof value === "boolean") {
    return value;
  }

  return fallback;
}

function normalizeSettings(
  settings: Partial<AppSettings>
): AppSettings {
  const theme =
    normalizeTheme(
      settings.theme
    );

  const version =
    settings.appVersion ||
    settings.version ||
    defaultSettings.appVersion;

  const accentColor =
    normalizeAccentColor(
      settings.appAccentColor ||
        settings.accentColor
    );

  return {
    appName:
      settings.appName ||
      defaultSettings.appName,

    companyName:
      settings.companyName ||
      defaultSettings.companyName,

    appVersion:
      version,

    version,

    theme,

    darkMode:
      typeof settings.darkMode === "boolean"
        ? settings.darkMode
        : false,

    appAccentColor:
      accentColor,

    accentColor:
      accentColor,

    sidebarPosition:
      normalizeSidebarPosition(
        settings.sidebarPosition
      ),

    showVersion:
      normalizeBoolean(
        settings.showVersion,
        true
      ),

    compactMode:
      normalizeBoolean(
        settings.compactMode,
        false
      ),

    showDemoHints:
      normalizeBoolean(
        settings.showDemoHints,
        true
      ),

    enableTicketTemplates:
      normalizeBoolean(
        settings.enableTicketTemplates,
        true
      ),

    enableTicketComments:
      normalizeBoolean(
        settings.enableTicketComments,
        true
      ),

    enableActivityLog:
      normalizeBoolean(
        settings.enableActivityLog,
        true
      ),

    defaultUserRole:
      normalizeDefaultUserRole(
        settings.defaultUserRole
      ),

    updatedAt:
      settings.updatedAt ||
      new Date().toLocaleString(),
  };
}

export function getDefaultAppSettings(): AppSettings {
  return normalizeSettings(
    defaultSettings
  );
}

export function getAppSettings(): AppSettings {
  if (typeof window === "undefined") {
    return getDefaultAppSettings();
  }

  const raw =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!raw) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        defaultSettings
      )
    );

    return getDefaultAppSettings();
  }

  try {
    const parsed =
      JSON.parse(
        raw
      );

    return normalizeSettings(
      parsed
    );
  } catch {
    return getDefaultAppSettings();
  }
}

export function saveAppSettings(
  settings: Partial<AppSettings>
): AppSettings {
  if (typeof window === "undefined") {
    return normalizeSettings(
      settings
    );
  }

  const currentSettings =
    getAppSettings();

  const normalizedSettings =
    normalizeSettings({
      ...currentSettings,
      ...settings,

      updatedAt:
        new Date().toLocaleString(),
    });

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      normalizedSettings
    )
  );

  dispatchAppSettingsUpdated();

  return normalizedSettings;
}

export function updateAppSettings(
  updates: Partial<AppSettings>
): AppSettings {
  return saveAppSettings(
    updates
  );
}

export function resetAppSettings(): AppSettings {
  return saveAppSettings(
    defaultSettings
  );
}

export function clearAppSettings() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );

  dispatchAppSettingsUpdated();
}

export function getThemeLabel(
  theme: AppTheme | string
) {
  if (theme === "light") {
    return "Hell";
  }

  if (theme === "dark") {
    return "Dunkel";
  }

  return "Modern";
}

export function getAccentColorLabel(
  color: AppAccentColor | string
) {
  if (color === "blue") {
    return "Blau";
  }

  if (color === "indigo") {
    return "Indigo";
  }

  if (color === "emerald") {
    return "Grün";
  }

  if (color === "amber") {
    return "Amber";
  }

  if (color === "orange") {
    return "Orange";
  }

  if (color === "red") {
    return "Rot";
  }

  return "Standard";
}

export function getSidebarPositionLabel(
  position: SidebarPosition | string
) {
  if (position === "right") {
    return "Rechts";
  }

  return "Links";
}

export function getDefaultUserRoleLabel(
  role: UserRole | string
) {
  if (role === "admin") {
    return "Administrator";
  }

  if (role === "editor") {
    return "Bearbeiter";
  }

  if (role === "viewer") {
    return "Leser";
  }

  return "Unbekannt";
}

export function getThemeOptions() {
  return [
    {
      value:
        "modern" as AppTheme,

      label:
        getThemeLabel(
          "modern"
        ),
    },
    {
      value:
        "light" as AppTheme,

      label:
        getThemeLabel(
          "light"
        ),
    },
    {
      value:
        "dark" as AppTheme,

      label:
        getThemeLabel(
          "dark"
        ),
    },
  ];
}

export function getAccentColorOptions() {
  return [
    {
      value:
        "zinc" as AppAccentColor,

      label:
        getAccentColorLabel(
          "zinc"
        ),
    },
    {
      value:
        "blue" as AppAccentColor,

      label:
        getAccentColorLabel(
          "blue"
        ),
    },
    {
      value:
        "indigo" as AppAccentColor,

      label:
        getAccentColorLabel(
          "indigo"
        ),
    },
    {
      value:
        "emerald" as AppAccentColor,

      label:
        getAccentColorLabel(
          "emerald"
        ),
    },
    {
      value:
        "amber" as AppAccentColor,

      label:
        getAccentColorLabel(
          "amber"
        ),
    },
    {
      value:
        "red" as AppAccentColor,

      label:
        getAccentColorLabel(
          "red"
        ),
    },
  ];
}

export function getSidebarPositionOptions() {
  return [
    {
      value:
        "left" as SidebarPosition,

      label:
        getSidebarPositionLabel(
          "left"
        ),
    },
    {
      value:
        "right" as SidebarPosition,

      label:
        getSidebarPositionLabel(
          "right"
        ),
    },
  ];
}

export function getDefaultUserRoleOptions() {
  return [
    {
      value:
        "admin" as UserRole,

      label:
        getDefaultUserRoleLabel(
          "admin"
        ),
    },
    {
      value:
        "editor" as UserRole,

      label:
        getDefaultUserRoleLabel(
          "editor"
        ),
    },
    {
      value:
        "viewer" as UserRole,

      label:
        getDefaultUserRoleLabel(
          "viewer"
        ),
    },
  ];
}

export function getSettings() {
  return getAppSettings();
}

export function saveSettings(
  settings: Partial<AppSettings>
) {
  return saveAppSettings(
    settings
  );
}

export function updateSettings(
  updates: Partial<AppSettings>
) {
  return updateAppSettings(
    updates
  );
}

export function resetSettings() {
  return resetAppSettings();
}

export function clearSettings() {
  clearAppSettings();
}