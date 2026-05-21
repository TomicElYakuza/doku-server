export type AppTheme =
  | "modern"
  | "dark"
  | "system";

export type AppAccentColor =
  | "zinc"
  | "blue"
  | "indigo"
  | "emerald"
  | "amber"
  | "red";

export type SidebarPosition =
  | "left"
  | "right";

export type AppSettings = {
  appName: string;
  companyName: string;
  appVersion: string;
  version: string;
  theme: AppTheme;
  darkMode: boolean;
  accentColor: AppAccentColor;
  appAccentColor: AppAccentColor;
  sidebarPosition: SidebarPosition;
  showVersion: boolean;
  compactMode: boolean;
  showDemoHints: boolean;
  enableTicketTemplates: boolean;
  enableTicketComments: boolean;
  enableActivityLog: boolean;
  defaultUserRole: "admin" | "editor" | "viewer";
  updatedAt: string;
};

export type AppSettingsUpdateInput =
  Partial<AppSettings>;