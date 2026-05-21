import {
  activityRepository,
} from "./activityRepository";

function createStorageActivity(
  type: string,
  title: string,
  description: string,
  metadata: Record<
    string,
    string | number | boolean | null
  > = {}
) {
  void activityRepository
    .create({
      type,

      title,

      description,

      entityType:
        "storage",

      entityId:
        "system-storage",

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
        "Intern",

      department:
        "Allgemein",

      metadata,
    })
    .catch(
      (error) => {
        console.error(
          "Storage-Aktivität konnte nicht gespeichert werden:",
          error
        );
      }
    );
}

export function saveStorageClearedActivity() {
  createStorageActivity(
    "deleted",
    "Speicher bereinigt",
    "Der Anwendungsspeicher wurde bereinigt."
  );
}

export function saveStorageResetActivity() {
  createStorageActivity(
    "restored",
    "Speicher zurückgesetzt",
    "Der Anwendungsspeicher wurde zurückgesetzt."
  );
}

export function saveStorageImportedActivity(
  count = 0
) {
  createStorageActivity(
    "created",
    "Daten importiert",
    `${count} Datensätze wurden importiert.`,
    {
      count,
    }
  );
}

export function saveStorageExportedActivity(
  count = 0
) {
  createStorageActivity(
    "system",
    "Daten exportiert",
    `${count} Datensätze wurden exportiert.`,
    {
      count,
    }
  );
}

export function saveStorageBackupCreatedActivity() {
  createStorageActivity(
    "created",
    "Backup erstellt",
    "Ein Backup wurde erstellt."
  );
}