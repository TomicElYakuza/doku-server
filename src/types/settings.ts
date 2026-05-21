export type {
  AppAccentColor,
  AppSettings,
  AppTheme,
  SidebarPosition,
} from "../lib/appSettingsStorage";

export type AppSettingsUpdateInput =
  Partial<
    import("../lib/appSettingsStorage").AppSettings
  >;