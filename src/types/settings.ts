import type {
  UserRole,
} from "./user";

export type AppTheme =
  | "modern"
  | "light"
  | "dark"
  | "system";

export type AppAccentColor =
  | "zinc"
  | "blue"
  | "green"
  | "red"
  | "orange"
  | "purple"
  | "indigo"
  | "emerald"
  | "amber";

export type SidebarPosition =
  | "left"
  | "right";

export type AppSettings = {
  appName: string;
  companyName: string;
  appVersion: string;
  version: string;

  theme: AppTheme | string;
  darkMode: boolean;
  accentColor: AppAccentColor | string;
  appAccentColor: AppAccentColor | string;
  compactMode: boolean;
  sidebarPosition: SidebarPosition | string;

  showVersion: boolean;
  showDemoHints: boolean;

  enableTicketComments: boolean;
  enableTicketTemplates: boolean;
  enableActivityLog: boolean;

  defaultUserRole: UserRole;

  updatedAt: string;
};

export type AppSettingsUpdateInput =
  Partial<AppSettings>;