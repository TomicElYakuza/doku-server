export type AppTheme =
  | "modern"
  | "light"
  | "dark"
  | "system";

export type AppAccentColor =
  | "zinc"
  | "indigo"
  | "blue"
  | "emerald"
  | "violet"
  | "rose";

export type AppSettings = {
  appName: string;
  companyName: string;
  theme: AppTheme;
  accentColor: AppAccentColor;
  compactMode: boolean;
  showDemoHints: boolean;
  enableTicketTemplates: boolean;
  enableTicketComments: boolean;
  enableActivityLog: boolean;
  defaultUserRole: "admin" | "editor" | "viewer";
  updatedAt: string;
};

const STORAGE_KEY =
  "dms_app_settings";

export const defaultAppSettings: AppSettings = {
  appName:
    "DMS Intranet",

  companyName:
    "Intern",

  theme:
    "modern",

  accentColor:
    "indigo",

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
}

function normalizeTheme(
  value: unknown
): AppTheme {
  if (value === "modern") {
    return "modern";
  }

  if (value === "light") {
    return "light";
  }

  if (value === "dark") {
    return "dark";
  }

  if (value === "system") {
    return "system";
  }

  return "modern";
}

function normalizeAccentColor(
  value: unknown
): AppAccentColor {
  if (value === "zinc") {
    return "zinc";
  }

  if (value === "indigo") {
    return "indigo";
  }

  if (value === "blue") {
    return "blue";
  }

  if (value === "emerald") {
    return "emerald";
  }

  if (value === "violet") {
    return "violet";
  }

  if (value === "rose") {
    return "rose";
  }

  return "indigo";
}

function normalizeDefaultRole(
  value: unknown
): "admin" | "editor" | "viewer" {
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
  return {
    appName:
      settings.appName ||
      defaultAppSettings.appName,

    companyName:
      settings.companyName ||
      defaultAppSettings.companyName,

    theme:
      normalizeTheme(
        settings.theme
      ),

    accentColor:
      normalizeAccentColor(
        settings.accentColor
      ),

    compactMode:
      normalizeBoolean(
        settings.compactMode,
        defaultAppSettings.compactMode
      ),

    showDemoHints:
      normalizeBoolean(
        settings.showDemoHints,
        defaultAppSettings.showDemoHints
      ),

    enableTicketTemplates:
      normalizeBoolean(
        settings.enableTicketTemplates,
        defaultAppSettings.enableTicketTemplates
      ),

    enableTicketComments:
      normalizeBoolean(
        settings.enableTicketComments,
        defaultAppSettings.enableTicketComments
      ),

    enableActivityLog:
      normalizeBoolean(
        settings.enableActivityLog,
        defaultAppSettings.enableActivityLog
      ),

    defaultUserRole:
      normalizeDefaultRole(
        settings.defaultUserRole
      ),

    updatedAt:
      settings.updatedAt ||
      new Date().toLocaleString(),
  };
}

export function getAppSettings(): AppSettings {
  if (typeof window === "undefined") {
    return defaultAppSettings;
  }

  const raw =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!raw) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        defaultAppSettings
      )
    );

    return defaultAppSettings;
  }

  try {
    const parsed =
      JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return defaultAppSettings;
    }

    return normalizeSettings(
      parsed
    );
  } catch {
    return defaultAppSettings;
  }
}

export function saveAppSettings(
  settings: AppSettings
) {
  if (typeof window === "undefined") {
    return settings;
  }

  const normalizedSettings =
    normalizeSettings({
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
) {
  const currentSettings =
    getAppSettings();

  const updatedSettings =
    normalizeSettings({
      ...currentSettings,
      ...updates,

      updatedAt:
        new Date().toLocaleString(),
    });

  return saveAppSettings(
    updatedSettings
  );
}

export function resetAppSettings() {
  return saveAppSettings({
    ...defaultAppSettings,

    updatedAt:
      new Date().toLocaleString(),
  });
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
  if (theme === "modern") {
    return "Modern";
  }

  if (theme === "light") {
    return "Hell";
  }

  if (theme === "dark") {
    return "Dunkel";
  }

  if (theme === "system") {
    return "System";
  }

  return "Unbekannt";
}

export function getAccentColorLabel(
  accentColor: AppAccentColor | string
) {
  if (accentColor === "zinc") {
    return "Neutral";
  }

  if (accentColor === "indigo") {
    return "Indigo";
  }

  if (accentColor === "blue") {
    return "Blau";
  }

  if (accentColor === "emerald") {
    return "Emerald";
  }

  if (accentColor === "violet") {
    return "Violett";
  }

  if (accentColor === "rose") {
    return "Rose";
  }

  return "Unbekannt";
}

export function getThemeOptions(): {
  value: AppTheme;
  label: string;
}[] {
  return [
    {
      value:
        "modern",

      label:
        "Modern",
    },

    {
      value:
        "light",

      label:
        "Hell",
    },

    {
      value:
        "dark",

      label:
        "Dunkel",
    },

    {
      value:
        "system",

      label:
        "System",
    },
  ];
}

export function getAccentColorOptions(): {
  value: AppAccentColor;
  label: string;
}[] {
  return [
    {
      value:
        "indigo",

      label:
        "Indigo",
    },

    {
      value:
        "blue",

      label:
        "Blau",
    },

    {
      value:
        "emerald",

      label:
        "Emerald",
    },

    {
      value:
        "violet",

      label:
        "Violett",
    },

    {
      value:
        "rose",

      label:
        "Rose",
    },

    {
      value:
        "zinc",

      label:
        "Neutral",
    },
  ];
}