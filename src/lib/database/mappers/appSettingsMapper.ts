import type {
  AppSettings,
} from "../../../types/settings";

export type AppSettingsRow = {
  id: number;
  app_name: string;
  company_name: string;
  app_version: string;
  theme: string;
  dark_mode: boolean;
  accent_color: string;
  sidebar_position: string;
  show_version: boolean;
  compact_mode: boolean;
  show_demo_hints: boolean;
  enable_ticket_templates: boolean;
  enable_ticket_comments: boolean;
  enable_activity_log: boolean;
  default_user_role: string;
  updated_at: string;
};

export function mapAppSettingsRow(
  row: AppSettingsRow
): AppSettings {
  return {
    appName:
      row.app_name,

    companyName:
      row.company_name,

    appVersion:
      row.app_version,

    version:
      row.app_version,

    theme:
      row.theme as AppSettings["theme"],

    darkMode:
      Boolean(
        row.dark_mode
      ),

    accentColor:
      row.accent_color as AppSettings["accentColor"],

    appAccentColor:
      row.accent_color as AppSettings["appAccentColor"],

    sidebarPosition:
      row.sidebar_position as AppSettings["sidebarPosition"],

    showVersion:
      Boolean(
        row.show_version
      ),

    compactMode:
      Boolean(
        row.compact_mode
      ),

    showDemoHints:
      Boolean(
        row.show_demo_hints
      ),

    enableTicketTemplates:
      Boolean(
        row.enable_ticket_templates
      ),

    enableTicketComments:
      Boolean(
        row.enable_ticket_comments
      ),

    enableActivityLog:
      Boolean(
        row.enable_activity_log
      ),

    defaultUserRole:
      row.default_user_role as AppSettings["defaultUserRole"],

    updatedAt:
      new Date(
        row.updated_at
      ).toLocaleString(),
  };
}