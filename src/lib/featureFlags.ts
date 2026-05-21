import {
  appSettingsRepository,
} from "./appSettingsRepository";

import type {
  AppSettings,
} from "../types/settings";

function getSettings(): AppSettings {
  return appSettingsRepository.get();
}

export function areTicketTemplatesEnabled() {
  const settings =
    getSettings();

  return Boolean(
    settings.enableTicketTemplates
  );
}

export function areTicketCommentsEnabled() {
  const settings =
    getSettings();

  return Boolean(
    settings.enableTicketComments
  );
}

export function isActivityLogEnabled() {
  const settings =
    getSettings();

  return Boolean(
    settings.enableActivityLog
  );
}

export function shouldShowDemoHints() {
  const settings =
    getSettings();

  return Boolean(
    settings.showDemoHints
  );
}

export function isCompactModeEnabled() {
  const settings =
    getSettings();

  return Boolean(
    settings.compactMode
  );
}

export function isDarkModeEnabled() {
  const settings =
    getSettings();

  return Boolean(
    settings.darkMode
  );
}

export function shouldShowVersion() {
  const settings =
    getSettings();

  return Boolean(
    settings.showVersion
  );
}

export function getConfiguredTheme() {
  const settings =
    getSettings();

  return (
    settings.theme ||
    "modern"
  );
}

export function getConfiguredAccentColor() {
  const settings =
    getSettings();

  return (
    settings.accentColor ||
    settings.appAccentColor ||
    "zinc"
  );
}

export function getConfiguredSidebarPosition() {
  const settings =
    getSettings();

  return (
    settings.sidebarPosition ||
    "left"
  );
}

export function getConfiguredDefaultUserRole() {
  const settings =
    getSettings();

  return (
    settings.defaultUserRole ||
    "viewer"
  );
}