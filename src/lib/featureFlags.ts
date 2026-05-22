import {
  appSettingsRepository,
} from "./appSettingsRepository";

import type {
  AppSettings,
} from "../types/settings";

export async function getFeatureSettings(): Promise<AppSettings> {
  try {
    return await appSettingsRepository.get();
  } catch (error) {
    console.error(
      "Feature-Einstellungen konnten nicht geladen werden:",
      error
    );

    return appSettingsRepository.getDefault();
  }
}

export async function areTicketTemplatesEnabled() {
  const settings =
    await getFeatureSettings();

  return settings.enableTicketTemplates;
}

export async function areTicketCommentsEnabled() {
  const settings =
    await getFeatureSettings();

  return settings.enableTicketComments;
}

export async function isActivityLogEnabled() {
  const settings =
    await getFeatureSettings();

  return settings.enableActivityLog;
}

export async function areDemoHintsEnabled() {
  const settings =
    await getFeatureSettings();

  return settings.showDemoHints;
}