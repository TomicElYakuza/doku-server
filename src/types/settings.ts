export type AppTheme =
  | "modern"
  | "light"
  | "dark"
  | "system";

export type AppAccentColor =
  | "velunis"
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

export type DefaultListView =
  | "table"
  | "cards";

export type AppSettings = {
  id?: string;
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
  enableTicketTemplates: boolean;
  enableTicketComments: boolean;
  enableActivityLog: boolean;
  defaultUserRole: AppDefaultUserRole;
  defaultTicketView?: DefaultListView;
  defaultWikiView?: DefaultListView;
  hideClosedTicketsByDefault?: boolean;
  ticketsPerPage?: number;
  wikiPerPage?: number;
  updatedAt: string;
};

export type AppSettingsUpdateInput = Partial<AppSettings>;

