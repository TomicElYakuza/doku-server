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

export type AppDefaultUserRole =
  | "admin"
  | "department_lead"
  | "employee";

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
  defaultUserRole: AppDefaultUserRole;
  updatedAt: string;
};

export type AppSettingsUpdateInput =
  Partial<AppSettings>;