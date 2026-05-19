import {
  saveActivity,
} from "./activityStorage";

import {
  getCurrentUser,
} from "./permissions";

type StorageActivityAction =
  | "exported"
  | "imported"
  | "cleared_key"
  | "cleared_all";

function getUserContext() {
  const user =
    getCurrentUser();

  return {
    userName:
      user?.name ||
      "Unbekannt",

    userEmail:
      user?.email ||
      "",

    user:
      user?.name ||
      "Unbekannt",

    companyId:
      user?.companyId ||
      "",

    departmentId:
      user?.departmentId ||
      "",

    company:
      user?.company ||
      "Intern",

    department:
      user?.department ||
      "Allgemein",
  };
}

function getStorageActivityTitle(
  action: StorageActivityAction,
  label?: string
) {
  if (action === "exported") {
    return "Speicher exportiert";
  }

  if (action === "imported") {
    return "Speicher importiert";
  }

  if (action === "cleared_key") {
    return `Speicherbereich gelöscht: ${label || "Unbekannt"}`;
  }

  if (action === "cleared_all") {
    return "Gesamten lokalen Speicher gelöscht";
  }

  return "Speicher-Aktion";
}

function getStorageActivityDescription(
  action: StorageActivityAction,
  label?: string
) {
  if (action === "exported") {
    return "Lokale DMS-Daten wurden als JSON exportiert.";
  }

  if (action === "imported") {
    return "Lokale DMS-Daten wurden aus einer JSON-Datei importiert.";
  }

  if (action === "cleared_key") {
    return `Der lokale Speicherbereich "${label || "Unbekannt"}" wurde gelöscht.`;
  }

  if (action === "cleared_all") {
    return "Alle lokalen DMS-Daten wurden gelöscht.";
  }

  return "Eine Speicher-Aktion wurde durchgeführt.";
}

export function saveStorageActivity(
  action: StorageActivityAction,
  options?: {
    key?: string;
    label?: string;
    area?: string;
    itemCount?: number;
    size?: number;
  }
) {
  const userContext =
    getUserContext();

  saveActivity({
    type:
      "system",

    title:
      getStorageActivityTitle(
        action,
        options?.label
      ),

    description:
      getStorageActivityDescription(
        action,
        options?.label
      ),

    entityId:
      options?.key ||
      "storage",

    entityType:
      "storage",

    userName:
      userContext.userName,

    userEmail:
      userContext.userEmail,

    user:
      userContext.user,

    companyId:
      userContext.companyId,

    departmentId:
      userContext.departmentId,

    company:
      userContext.company,

    department:
      userContext.department,

    metadata:
      {
        action,

        key:
          options?.key ||
          "",

        label:
          options?.label ||
          "",

        area:
          options?.area ||
          "",

        itemCount:
          options?.itemCount ??
          0,

        size:
          options?.size ??
          0,
      },
  });
}

export function saveStorageExportedActivity() {
  saveStorageActivity(
    "exported"
  );
}

export function saveStorageImportedActivity() {
  saveStorageActivity(
    "imported"
  );
}

export function saveStorageKeyClearedActivity(
  options: {
    key: string;
    label: string;
    area: string;
    itemCount: number;
    size: number;
  }
) {
  saveStorageActivity(
    "cleared_key",
    options
  );
}

export function saveStorageAllClearedActivity() {
  saveStorageActivity(
    "cleared_all"
  );
}