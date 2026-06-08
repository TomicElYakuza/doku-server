import {
  appSettingsRepository,
} from "./appSettingsRepository";
import type {
  AppSettings,
} from "../types/settings";

export type FeatureSettings = {
  ticketCommentsEnabled: boolean;
  ticketTemplatesEnabled: boolean;
  activityLogEnabled: boolean;
};

function mapFeatureSettings(settings: AppSettings): FeatureSettings {
  return {
    ticketCommentsEnabled: settings.enableTicketComments,
    ticketTemplatesEnabled: settings.enableTicketTemplates,
    activityLogEnabled: settings.enableActivityLog,
  };
}

export async function getFeatureSettings(): Promise<FeatureSettings> {
  const settings = await appSettingsRepository.get();

  return mapFeatureSettings(settings);
}

export async function areTicketCommentsEnabled() {
  const settings = await getFeatureSettings();

  return settings.ticketCommentsEnabled;
}

export async function areTicketTemplatesEnabled() {
  const settings = await getFeatureSettings();

  return settings.ticketTemplatesEnabled;
}

export async function isActivityLogEnabled() {
  const settings = await getFeatureSettings();

  return settings.activityLogEnabled;
}
