import {
  getAppSettings,
} from "./appSettingsStorage";

export function areDemoHintsEnabled() {
  return getAppSettings()
    .showDemoHints;
}

export function areTicketTemplatesEnabled() {
  return getAppSettings()
    .enableTicketTemplates;
}

export function areTicketCommentsEnabled() {
  return getAppSettings()
    .enableTicketComments;
}

export function isActivityLogEnabled() {
  return getAppSettings()
    .enableActivityLog;
}

export function getDefaultUserRoleFromSettings() {
  return getAppSettings()
    .defaultUserRole;
}

export function getFeatureFlags() {
  const settings =
    getAppSettings();

  return {
    showDemoHints:
      settings.showDemoHints,

    enableTicketTemplates:
      settings.enableTicketTemplates,

    enableTicketComments:
      settings.enableTicketComments,

    enableActivityLog:
      settings.enableActivityLog,

    defaultUserRole:
      settings.defaultUserRole,
  };
}