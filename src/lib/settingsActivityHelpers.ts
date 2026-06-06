import {
  activityRepository,
} from "./activityRepository";

import type {
  AppSettings,
} from "../types/settings";

function createSettingsActivity(
  type: string,
  title: string,
  description: string,
  settings?: Partial<AppSettings>
) {
  void activityRepository
    .create({
      type,

      title,

      description,

      entityType:
        "settings",

      entityId:
        "app-settings",

      userName:
        "System",

      userEmail:
        "",

      user:
        "System",

      companyId:
        "",

      departmentId:
        "",

      company:
        settings?.companyName ||
        "Intern",

      department:
        "",

      metadata: {
        appName:
          settings?.appName ||
          null,

        companyName:
          settings?.companyName ||
          null,

        appVersion:
          settings?.appVersion ||
          settings?.version ||
          null,

        theme:
          settings?.theme ||
          null,

        accentColor:
          settings?.accentColor ||
          settings?.appAccentColor ||
          null,
      },
    })
    .catch(
      (error) => {
        console.error(
          "Einstellungen-AktivitÃ¤t konnte nicht gespeichert werden:",
          error
        );
      }
    );
}

export function saveSettingsUpdatedActivity(
  settings: AppSettings
) {
  createSettingsActivity(
    "edited",
    "Einstellungen bearbeitet",
    "Die Systemeinstellungen wurden bearbeitet.",
    settings
  );
}

export function saveSettingsResetActivity(
  settings?: Partial<AppSettings>
) {
  createSettingsActivity(
    "restored",
    "Einstellungen zurÃ¼ckgesetzt",
    "Die Systemeinstellungen wurden auf Standardwerte zurÃ¼ckgesetzt.",
    settings
  );
}

export function saveSettingsChangedActivity(
  settings: AppSettings
) {
  saveSettingsUpdatedActivity(
    settings
  );
}

