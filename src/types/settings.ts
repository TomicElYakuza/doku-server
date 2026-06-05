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

export type AppDefaultUserRole = UserRole;

export type DefaultListView =
  | "table"
  | "cards";

export type AppSettings = {
  id?: string;
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
  enableTicketComments: boolean;
  enableTicketTemplates: boolean;
  enableActivityLog: boolean;
  defaultUserRole: UserRole;
  defaultTicketView: DefaultListView;
  defaultWikiView: DefaultListView;
  hideClosedTicketsByDefault: boolean;
  ticketsPerPage: number;
  wikiPerPage: number;
  updatedAt: string;
};

export type AppSettingsUpdateInput = Partial<AppSettings>;