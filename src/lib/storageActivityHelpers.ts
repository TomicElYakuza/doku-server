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
        "",

      metadata,
    })
    .catch(
      (error) => {
        console.error(
          "Storage-AktivitÃ¤t konnte nicht gespeichert werden:",
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
    "Speicher zurÃ¼ckgesetzt",
    "Der Anwendungsspeicher wurde zurÃ¼ckgesetzt."
  );
}

export function saveStorageImportedActivity(
  count = 0
) {
  createStorageActivity(
    "created",
    "Daten importiert",
    `${count} DatensÃ¤tze wurden importiert.`,
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
    `${count} DatensÃ¤tze wurden exportiert.`,
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

