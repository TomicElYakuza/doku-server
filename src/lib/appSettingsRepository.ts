import {
  requestJson,
} from "./apiClient";

import type {
  AppAccentColor,
  AppSettings,
  AppSettingsUpdateInput,
  AppTheme,
  SidebarPosition,
} from "../types/settings";

import type {
  UserRole,
} from "../types/user";

export type AppSettingsRepository = {
  get: () => Promise<AppSettings>;
  getDefault: () => AppSettings;
  save: (settings: AppSettingsUpdateInput) => Promise<AppSettings>;
  update: (updates: AppSettingsUpdateInput) => Promise<AppSettings>;
  reset: () => Promise<AppSettings>;
  clear: () => Promise<void>;

  getThemeLabel: (theme: AppTheme | string) => string;
  getAccentColorLabel: (color: AppAccentColor | string) => string;
  getSidebarPositionLabel: (position: SidebarPosition | string) => string;
  getDefaultUserRoleLabel: (role: UserRole | string) => string;

  getThemeOptions: () => Array<{
    value: AppTheme;
    label: string;
  }>;

  getAccentColorOptions: () => Array<{
    value: AppAccentColor;
    label: string;
  }>;

  getSidebarPositionOptions: () => Array<{
    value: SidebarPosition;
    label: string;
  }>;

  getDefaultUserRoleOptions: () => Array<{
    value: UserRole;
    label: string;
  }>;
};

function dispatchSettingsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(
      "appSettingsUpdated"
    )
  );
}

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

  accentColor:
    "zinc",

  appAccentColor:
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

export const postgresAppSettingsRepository: AppSettingsRepository = {
  async get() {
    return requestJson<AppSettings>(
      "/api/app-settings"
    );
  },

  getDefault() {
    return defaultSettings;
  },

  async save(
    settings: AppSettingsUpdateInput
  ) {
    const updatedSettings =
      await requestJson<AppSettings>(
        "/api/app-settings",
        {
          method:
            "PATCH",

          body:
            JSON.stringify(
              settings
            ),
        }
      );

    dispatchSettingsUpdated();

    return updatedSettings;
  },

  async update(
    updates: AppSettingsUpdateInput
  ) {
    return postgresAppSettingsRepository.save(
      updates
    );
  },

  async reset() {
    const updatedSettings =
      await postgresAppSettingsRepository.save(
        defaultSettings
      );

    dispatchSettingsUpdated();

    return updatedSettings;
  },

  async clear() {
    await postgresAppSettingsRepository.reset();
  },

  getThemeLabel(
    theme: AppTheme | string
  ) {
    if (theme === "dark") {
      return "Dark";
    }

    if (theme === "system") {
      return "System";
    }

    return "Modern";
  },

  getAccentColorLabel(
    color: AppAccentColor | string
  ) {
    if (color === "blue") {
      return "Blau";
    }

    if (color === "indigo") {
      return "Indigo";
    }

    if (color === "emerald") {
      return "Emerald";
    }

    if (color === "amber") {
      return "Amber";
    }

    if (color === "red") {
      return "Rot";
    }

    return "Zinc";
  },

  getSidebarPositionLabel(
    position: SidebarPosition | string
  ) {
    if (position === "right") {
      return "Rechts";
    }

    return "Links";
  },

  getDefaultUserRoleLabel(
    role: UserRole | string
  ) {
    if (role === "admin") {
      return "Administrator";
    }

    if (role === "editor") {
      return "Bearbeiter";
    }

    return "Leser";
  },

  getThemeOptions() {
    return [
      {
        value:
          "modern",

        label:
          "Modern",
      },
      {
        value:
          "dark",

        label:
          "Dark",
      },
      {
        value:
          "system",

        label:
          "System",
      },
    ];
  },

  getAccentColorOptions() {
    return [
      {
        value:
          "zinc",

        label:
          "Zinc",
      },
      {
        value:
          "blue",

        label:
          "Blau",
      },
      {
        value:
          "indigo",

        label:
          "Indigo",
      },
      {
        value:
          "emerald",

        label:
          "Emerald",
      },
      {
        value:
          "amber",

        label:
          "Amber",
      },
      {
        value:
          "red",

        label:
          "Rot",
      },
    ];
  },

  getSidebarPositionOptions() {
    return [
      {
        value:
          "left",

        label:
          "Links",
      },
      {
        value:
          "right",

        label:
          "Rechts",
      },
    ];
  },

  getDefaultUserRoleOptions() {
    return [
      {
        value:
          "viewer",

        label:
          "Leser",
      },
      {
        value:
          "editor",

        label:
          "Bearbeiter",
      },
      {
        value:
          "admin",

        label:
          "Administrator",
      },
    ];
  },
};

export const appSettingsRepository =
  postgresAppSettingsRepository;