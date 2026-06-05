import type {
  AppAccentColor,
  AppSettings,
  AppTheme,
  DefaultListView,
  SidebarPosition,
} from "../../../types/settings";
import type {
  UserRole,
} from "../../../types/user";

export type AppSettingsRow = {
  id?: string;
  app_name: string | null;
  company_name: string | null;
  app_version: string | null;
  theme: string | null;
  dark_mode: boolean | null;
  accent_color: string | null;
  app_accent_color?: string | null;
  sidebar_position: string | null;
  show_version: boolean | null;
  compact_mode: boolean | null;
  show_demo_hints?: boolean | null;
  enable_ticket_comments: boolean | null;
  enable_ticket_templates: boolean | null;
  enable_activity_log: boolean | null;
  default_user_role: string | null;
  default_ticket_view?: string | null;
  default_wiki_view?: string | null;
  hide_closed_tickets_by_default?: boolean | null;
  tickets_per_page?: number | null;
  wiki_per_page?: number | null;
  updated_at: string | Date | null;
};

function normalizeTheme(value?: string | null): AppTheme {
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

function normalizeAccentColor(value?: string | null): AppAccentColor {
  if (value === "velunis") {
    return "velunis";
  }

  if (value === "blue") {
    return "blue";
  }

  if (value === "green") {
    return "green";
  }

  if (value === "red") {
    return "red";
  }

  if (value === "orange") {
    return "orange";
  }

  if (value === "purple") {
    return "purple";
  }

  if (value === "indigo") {
    return "indigo";
  }

  if (value === "emerald") {
    return "emerald";
  }

  if (value === "amber") {
    return "amber";
  }

  return "zinc";
}

function normalizeSidebarPosition(value?: string | null): SidebarPosition {
  if (value === "right") {
    return "right";
  }

  return "left";
}

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

function normalizeUpdatedAt(value?: string | Date | null) {
  if (!value) {
    return new Date().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

export function mapAppSettingsRow(
  row: AppSettingsRow,
): AppSettings {
  const accentColor = normalizeAccentColor(row.accent_color);
  const appAccentColor = normalizeAccentColor(
    row.app_accent_color || row.accent_color,
  );

  return {
    id: row.id,
    appName: row.app_name || "Intranet",
    companyName: row.company_name || "Velunis",
    appVersion: row.app_version || "0.1.0",
    version: row.app_version || "0.1.0",
    theme: normalizeTheme(row.theme),
    darkMode: Boolean(row.dark_mode),
    accentColor,
    appAccentColor,
    sidebarPosition: normalizeSidebarPosition(row.sidebar_position),
    showVersion: row.show_version ?? true,
    compactMode: row.compact_mode ?? false,
    showDemoHints: row.show_demo_hints ?? false,
    enableTicketComments: row.enable_ticket_comments ?? true,
    enableTicketTemplates: row.enable_ticket_templates ?? true,
    enableActivityLog: row.enable_activity_log ?? true,
    defaultUserRole: normalizeDefaultUserRole(row.default_user_role),
    defaultTicketView: normalizeListView(row.default_ticket_view),
    defaultWikiView: normalizeListView(row.default_wiki_view),
    hideClosedTicketsByDefault:
      row.hide_closed_tickets_by_default ?? true,
    ticketsPerPage: normalizePageSize(row.tickets_per_page, 25),
    wikiPerPage: normalizePageSize(row.wiki_per_page, 25),
    updatedAt: normalizeUpdatedAt(row.updated_at),
  };
}