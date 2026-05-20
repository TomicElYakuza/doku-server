import {
  clearAppSettings,
  getAccentColorLabel,
  getAccentColorOptions,
  getAppSettings,
  getDefaultAppSettings,
  getDefaultUserRoleLabel,
  getDefaultUserRoleOptions,
  getSidebarPositionLabel,
  getSidebarPositionOptions,
  getThemeLabel,
  getThemeOptions,
  resetAppSettings,
  saveAppSettings,
  updateAppSettings,
} from "./appSettingsStorage";

import type {
  AppAccentColor,
  AppSettings,
  AppTheme,
  SidebarPosition,
} from "./appSettingsStorage";

import type {
  UserRole,
} from "./userStorage";

export type AppSettingsUpdateInput =
  Partial<AppSettings>;

export type AppSettingsRepository = {
  get: () => AppSettings;
  getDefault: () => AppSettings;
  save: (settings: AppSettingsUpdateInput) => AppSettings;
  update: (updates: AppSettingsUpdateInput) => AppSettings;
  reset: () => AppSettings;
  clear: () => void;

  getThemeLabel: (theme: AppTheme | string) => string;
  getAccentColorLabel: (color: AppAccentColor | string) => string;
  getSidebarPositionLabel: (position: SidebarPosition | string) => string;
  getDefaultUserRoleLabel: (role: UserRole | string) => string;

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
};

export const localAppSettingsRepository: AppSettingsRepository = {
  get() {
    return getAppSettings();
  },

  getDefault() {
    return getDefaultAppSettings();
  },

  save(
    settings: AppSettingsUpdateInput
  ) {
    return saveAppSettings(
      settings
    );
  },

  update(
    updates: AppSettingsUpdateInput
  ) {
    return updateAppSettings(
      updates
    );
  },

  reset() {
    return resetAppSettings();
  },

  clear() {
    clearAppSettings();
  },

  getThemeLabel(
    theme: AppTheme | string
  ) {
    return getThemeLabel(
      theme
    );
  },

  getAccentColorLabel(
    color: AppAccentColor | string
  ) {
    return getAccentColorLabel(
      color
    );
  },

  getSidebarPositionLabel(
    position: SidebarPosition | string
  ) {
    return getSidebarPositionLabel(
      position
    );
  },

  getDefaultUserRoleLabel(
    role: UserRole | string
  ) {
    return getDefaultUserRoleLabel(
      role
    );
  },

  getThemeOptions() {
    return getThemeOptions();
  },

  getAccentColorOptions() {
    return getAccentColorOptions();
  },

  getSidebarPositionOptions() {
    return getSidebarPositionOptions();
  },

  getDefaultUserRoleOptions() {
    return getDefaultUserRoleOptions();
  },
};

export const appSettingsRepository =
  localAppSettingsRepository;