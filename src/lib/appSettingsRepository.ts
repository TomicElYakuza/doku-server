import {
  requestJson,
} from "./apiClient";
import type {
  AppAccentColor,
  AppSettings,
  AppSettingsUpdateInput,
  AppTheme,
  DefaultListView,
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
  getDefaultListViewLabel: (view: DefaultListView | string) => string;
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
  getDefaultListViewOptions: () => Array<{
    value: DefaultListView;
    label: string;
  }>;
};

function dispatchSettingsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("appSettingsUpdated"),
  );
}

const defaultSettings: AppSettings = {
  appName: "Intranet",
  companyName: "Intern",
  appVersion: "0.1.0",
  version: "0.1.0",
  theme: "modern",
  darkMode: false,
  accentColor: "zinc",
  appAccentColor: "zinc",
  sidebarPosition: "left",
  showVersion: true,
  compactMode: false,
  showDemoHints: true,
  enableTicketTemplates: true,
  enableTicketComments: true,
  enableActivityLog: true,
  defaultUserRole: "employee",
  defaultTicketView: "table",
  defaultWikiView: "table",
  hideClosedTicketsByDefault: true,
  ticketsPerPage: 25,
  wikiPerPage: 25,
  updatedAt: new Date().toLocaleString(),
};

export const postgresAppSettingsRepository: AppSettingsRepository = {
  async get() {
    return requestJson<AppSettings>("/api/app-settings");
  },

  getDefault() {
    return defaultSettings;
  },

  async save(settings: AppSettingsUpdateInput) {
    const updatedSettings = await requestJson<AppSettings>(
      "/api/app-settings",
      {
        method: "PATCH",
        body: JSON.stringify(settings),
      },
    );

    dispatchSettingsUpdated();

    return updatedSettings;
  },

  async update(updates: AppSettingsUpdateInput) {
    return postgresAppSettingsRepository.save(updates);
  },

  async reset() {
    const updatedSettings = await requestJson<AppSettings>(
      "/api/app-settings",
      {
        method: "DELETE",
      },
    );

    dispatchSettingsUpdated();

    return updatedSettings;
  },

  async clear() {
    await postgresAppSettingsRepository.reset();
  },

  getThemeLabel(theme: AppTheme | string) {
    if (theme === "dark") {
      return "Dunkel";
    }

    if (theme === "light") {
      return "Hell";
    }

    if (theme === "system") {
      return "System";
    }

    return "Modern";
  },

  getAccentColorLabel(color: AppAccentColor | string) {
    if (color === "blue") {
      return "Blau";
    }

    if (color === "indigo") {
      return "Indigo";
    }

    if (color === "emerald") {
      return "Emerald";
    }

    if (color === "green") {
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

    if (color === "purple") {
      return "Lila";
    }

    return "Neutral";
  },

  getSidebarPositionLabel(position: SidebarPosition | string) {
    if (position === "right") {
      return "Rechts";
    }

    return "Links";
  },

  getDefaultUserRoleLabel(role: UserRole | string) {
    if (role === "admin") {
      return "Administrator";
    }

    if (role === "department_lead") {
      return "Abteilungsleiter";
    }

    return "Mitarbeiter";
  },

  getDefaultListViewLabel(view: DefaultListView | string) {
    if (view === "cards") {
      return "Karten";
    }

    return "Tabelle";
  },

  getThemeOptions() {
    return [
      {
        value: "modern",
        label: "Modern",
      },
      {
        value: "light",
        label: "Hell",
      },
      {
        value: "dark",
        label: "Dunkel",
      },
      {
        value: "system",
        label: "System",
      },
    ];
  },

  getAccentColorOptions() {
    return [
      {
        value: "zinc",
        label: "Neutral",
      },
      {
        value: "blue",
        label: "Blau",
      },
      {
        value: "green",
        label: "Grün",
      },
      {
        value: "red",
        label: "Rot",
      },
      {
        value: "orange",
        label: "Orange",
      },
      {
        value: "purple",
        label: "Lila",
      },
      {
        value: "indigo",
        label: "Indigo",
      },
      {
        value: "emerald",
        label: "Emerald",
      },
      {
        value: "amber",
        label: "Amber",
      },
    ];
  },

  getSidebarPositionOptions() {
    return [
      {
        value: "left",
        label: "Links",
      },
      {
        value: "right",
        label: "Rechts",
      },
    ];
  },

  getDefaultUserRoleOptions() {
    return [
      {
        value: "employee",
        label: "Mitarbeiter",
      },
      {
        value: "department_lead",
        label: "Abteilungsleiter",
      },
      {
        value: "admin",
        label: "Administrator",
      },
    ];
  },

  getDefaultListViewOptions() {
    return [
      {
        value: "table",
        label: "Tabelle",
      },
      {
        value: "cards",
        label: "Karten",
      },
    ];
  },
};

export const appSettingsRepository = postgresAppSettingsRepository;