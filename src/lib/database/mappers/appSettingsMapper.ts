import type {
  AppSettings,
  DefaultListView,
} from "../../../types/settings";
import type {
  UserRole,
} from "../../../types/user";

export type AppSettingsRow = {
  id?: string;
  app_name: string;
  company_name: string;
  app_version: string;
  theme: string;
  dark_mode: boolean;
  accent_color: string;
  app_accent_color?: string | null;
  sidebar_position: string;
  show_version: boolean;
  compact_mode: boolean;
  enable_ticket_comments: boolean;
  enable_ticket_templates: boolean;
  enable_activity_log: boolean;
  default_user_role: string;
  default_ticket_view?: string | null;
  default_wiki_view?: string | null;
  hide_closed_tickets_by_default?: boolean | null;
  tickets_per_page?: number | null;
  wiki_per_page?: number | null;
  updated_at: string;
};

function normalizeDefaultUserRole(value?: string | null): UserRole {
  if (value === "admin") {
    return "admin";
  }

  if (value === "department_lead") {
    return "department_lead";
  }

  return "employee";
}

function normalizeListView(value?: string | null): DefaultListView {
  if (value === "cards") {
    return "cards";
  }

  return "table";
}

function normalizePageSize(
  value: unknown,
  fallback: number,
) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  if (numberValue < 5) {
    return 5;
  }

  if (numberValue > 100) {
    return 100;
  }

  return Math.floor(numberValue);
}

export function mapAppSettingsRow(
  row: AppSettingsRow,
): AppSettings {
  return {
    id: row.id,
    appName: row.app_name,
    companyName: row.company_name,
    appVersion: row.app_version,
    version: row.app_version,
    theme: row.theme,
    darkMode: row.dark_mode,
    accentColor: row.accent_color,
    appAccentColor: row.app_accent_color || row.accent_color,
    sidebarPosition: row.sidebar_position,
    showVersion: row.show_version,
    compactMode: row.compact_mode,
    enableTicketComments: row.enable_ticket_comments,
    enableTicketTemplates: row.enable_ticket_templates,
    enableActivityLog: row.enable_activity_log,
    defaultUserRole: normalizeDefaultUserRole(row.default_user_role),
    defaultTicketView: normalizeListView(row.default_ticket_view),
    defaultWikiView: normalizeListView(row.default_wiki_view),
    hideClosedTicketsByDefault: row.hide_closed_tickets_by_default ?? true,
    ticketsPerPage: normalizePageSize(row.tickets_per_page, 25),
    wikiPerPage: normalizePageSize(row.wiki_per_page, 25),
    updatedAt: row.updated_at,
  };
}