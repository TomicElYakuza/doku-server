export type ActivityType =
  | "created"
  | "updated"
  | "deleted"
  | "restored"
  | "commented"
  | "wiki_created"
  | "wiki_updated"
  | "wiki_deleted"
  | "wiki_restored"
  | "ticket_created"
  | "ticket_updated"
  | "ticket_deleted"
  | "ticket_comment_created"
  | "ticket_comment_updated"
  | "ticket_comment_deleted"
  | "user_created"
  | "user_updated"
  | "user_deleted"
  | "company_created"
  | "company_updated"
  | "company_deleted"
  | "department_created"
  | "department_updated"
  | "department_deleted"
  | "settings_updated"
  | "system";

export type Activity = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;

  entityId?: string;
  entityType?: string;

  userName?: string;
  userEmail?: string;

  user?: string;

  companyId?: string;
  departmentId?: string;
  company?: string;
  department?: string;

  metadata?: Record<string, string | number | boolean | null>;

  createdAt: string;
};

export type ActivityInput = {
  id?: string;
  type?: ActivityType | string;
  title?: string;
  description?: string;

  entityId?: string;
  entityType?: string;

  userName?: string;
  userEmail?: string;
  user?: string;

  companyId?: string;
  departmentId?: string;
  company?: string;
  department?: string;

  metadata?: Record<string, string | number | boolean | null>;

  createdAt?: string;
};

type OrganizationReference = {
  companyId?: string;
  departmentId?: string;
  company?: string;
  department?: string;
};

const STORAGE_KEY =
  "dms_activities";

const SETTINGS_STORAGE_KEY =
  "dms_app_settings";

const defaultActivities: Activity[] = [
  {
    id:
      "activity-demo-1",

    type:
      "system",

    title:
      "System gestartet",

    description:
      "Demo-Daten wurden lokal im Browser vorbereitet.",

    entityId:
      "system",

    entityType:
      "system",

    userName:
      "Admin",

    userEmail:
      "admin@local",

    user:
      "Admin",

    companyId:
      "company-intern",

    departmentId:
      "department-it",

    company:
      "Intern",

    department:
      "IT",

    metadata:
      {
        source:
          "default",
      },

    createdAt:
      new Date().toLocaleString(),
  },
];

function dispatchActivityUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("activityUpdated")
  );
}

function isActivityWritingEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  const rawSettings =
    localStorage.getItem(
      SETTINGS_STORAGE_KEY
    );

  if (!rawSettings) {
    return true;
  }

  try {
    const parsed =
      JSON.parse(rawSettings);

    if (
      typeof parsed?.enableActivityLog === "boolean"
    ) {
      return parsed.enableActivityLog;
    }

    return true;
  } catch {
    return true;
  }
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function normalizeType(
  value: unknown
): ActivityType {
  const allowedTypes: ActivityType[] = [
    "created",
    "updated",
    "deleted",
    "restored",
    "commented",
    "wiki_created",
    "wiki_updated",
    "wiki_deleted",
    "wiki_restored",
    "ticket_created",
    "ticket_updated",
    "ticket_deleted",
    "ticket_comment_created",
    "ticket_comment_updated",
    "ticket_comment_deleted",
    "user_created",
    "user_updated",
    "user_deleted",
    "company_created",
    "company_updated",
    "company_deleted",
    "department_created",
    "department_updated",
    "department_deleted",
    "settings_updated",
    "system",
  ];

  if (
    typeof value === "string" &&
    allowedTypes.includes(
      value as ActivityType
    )
  ) {
    return value as ActivityType;
  }

  return "system";
}

function normalizeOrganizationReference(
  reference: OrganizationReference
): OrganizationReference {
  return {
    companyId:
      reference.companyId || "",

    departmentId:
      reference.departmentId || "",

    company:
      reference.company || "Intern",

    department:
      reference.department || "Allgemein",
  };
}

function normalizeMetadata(
  value: unknown
): Record<string, string | number | boolean | null> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  const result: Record<string, string | number | boolean | null> =
    {};

  Object.entries(
    value as Record<string, unknown>
  ).forEach(
    ([key, item]) => {
      if (
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "boolean" ||
        item === null
      ) {
        result[key] =
          item;
      }
    }
  );

  return result;
}

function normalizeActivity(
  activity: ActivityInput
): Activity {
  const now =
    new Date().toLocaleString();

  const organization =
    normalizeOrganizationReference({
      companyId:
        activity.companyId,

      departmentId:
        activity.departmentId,

      company:
        activity.company,

      department:
        activity.department,
    });

  const userName =
    activity.userName ||
    activity.user ||
    "";

  return {
    id:
      activity.id ||
      createId(),

    type:
      normalizeType(
        activity.type
      ),

    title:
      activity.title ||
      "Aktivität",

    description:
      activity.description ||
      "",

    entityId:
      activity.entityId ||
      "",

    entityType:
      activity.entityType ||
      "",

    userName,

    userEmail:
      activity.userEmail ||
      "",

    user:
      activity.user ||
      userName,

    companyId:
      organization.companyId,

    departmentId:
      organization.departmentId,

    company:
      organization.company,

    department:
      organization.department,

    metadata:
      normalizeMetadata(
        activity.metadata
      ),

    createdAt:
      activity.createdAt ||
      now,
  };
}

export function getActivities(): Activity[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!raw) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        defaultActivities
      )
    );

    return defaultActivities.map(
      (activity) =>
        normalizeActivity(
          activity
        )
    );
  }

  try {
    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(
        (activity) =>
          normalizeActivity(
            activity
          )
      )
      .sort(
        (a, b) =>
          new Date(
            b.createdAt
          ).getTime() -
          new Date(
            a.createdAt
          ).getTime()
      );
  } catch {
    return [];
  }
}

export function saveActivities(
  activities: ActivityInput[]
) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedActivities =
    activities.map(
      (activity) =>
        normalizeActivity(
          activity
        )
    );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      normalizedActivities
    )
  );

  dispatchActivityUpdated();
}

export function clearActivities() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );

  dispatchActivityUpdated();
}

export function resetActivities() {
  saveActivities(
    defaultActivities
  );
}

export function createActivity(
  activity: ActivityInput
): Activity {
  const newActivity =
    normalizeActivity({
      ...activity,

      id:
        activity.id ||
        createId(),

      createdAt:
        activity.createdAt ||
        new Date().toLocaleString(),
    });

  if (!isActivityWritingEnabled()) {
    return newActivity;
  }

  const activities =
    getActivities();

  saveActivities([
    newActivity,
    ...activities,
  ]);

  return newActivity;
}

export function addActivity(
  activity: ActivityInput
): Activity {
  return createActivity(
    activity
  );
}

export function saveActivity(
  activity: ActivityInput
): Activity {
  return createActivity(
    activity
  );
}

export function deleteActivity(
  id: string
) {
  const activities =
    getActivities();

  saveActivities(
    activities.filter(
      (activity) =>
        activity.id !== id
    )
  );
}

export function getActivityById(
  id: string
): Activity | null {
  return (
    getActivities().find(
      (activity) =>
        activity.id === id
    ) || null
  );
}

export function getActivitiesByType(
  type: ActivityType | string
) {
  return getActivities().filter(
    (activity) =>
      activity.type === type
  );
}

export function getActivitiesByEntity(
  entityType: string,
  entityId: string
) {
  return getActivities().filter(
    (activity) =>
      activity.entityType === entityType &&
      activity.entityId === entityId
  );
}

export function getActivitiesByCompanyId(
  companyId: string
) {
  return getActivities().filter(
    (activity) =>
      activity.companyId === companyId
  );
}

export function getActivitiesByDepartmentId(
  departmentId: string
) {
  return getActivities().filter(
    (activity) =>
      activity.departmentId === departmentId
  );
}

export function getActivityTypeLabel(
  type: ActivityType | string
) {
  if (type === "created") {
    return "Erstellt";
  }

  if (type === "updated") {
    return "Aktualisiert";
  }

  if (type === "deleted") {
    return "Gelöscht";
  }

  if (type === "restored") {
    return "Wiederhergestellt";
  }

  if (type === "commented") {
    return "Kommentiert";
  }

  if (type === "wiki_created") {
    return "Wiki erstellt";
  }

  if (type === "wiki_updated") {
    return "Wiki aktualisiert";
  }

  if (type === "wiki_deleted") {
    return "Wiki gelöscht";
  }

  if (type === "wiki_restored") {
    return "Wiki wiederhergestellt";
  }

  if (type === "ticket_created") {
    return "Ticket erstellt";
  }

  if (type === "ticket_updated") {
    return "Ticket aktualisiert";
  }

  if (type === "ticket_deleted") {
    return "Ticket gelöscht";
  }

  if (type === "ticket_comment_created") {
    return "Ticket-Kommentar erstellt";
  }

  if (type === "ticket_comment_updated") {
    return "Ticket-Kommentar aktualisiert";
  }

  if (type === "ticket_comment_deleted") {
    return "Ticket-Kommentar gelöscht";
  }

  if (type === "user_created") {
    return "Benutzer erstellt";
  }

  if (type === "user_updated") {
    return "Benutzer aktualisiert";
  }

  if (type === "user_deleted") {
    return "Benutzer gelöscht";
  }

  if (type === "company_created") {
    return "Firma erstellt";
  }

  if (type === "company_updated") {
    return "Firma aktualisiert";
  }

  if (type === "company_deleted") {
    return "Firma gelöscht";
  }

  if (type === "department_created") {
    return "Abteilung erstellt";
  }

  if (type === "department_updated") {
    return "Abteilung aktualisiert";
  }

  if (type === "department_deleted") {
    return "Abteilung gelöscht";
  }

  if (type === "settings_updated") {
    return "Einstellungen aktualisiert";
  }

  return "System";
}

export function getActivityTypeClass(
  type: ActivityType | string
) {
  if (
    type === "created" ||
    type === "wiki_created" ||
    type === "ticket_created" ||
    type === "ticket_comment_created" ||
    type === "user_created" ||
    type === "company_created" ||
    type === "department_created"
  ) {
    return "bg-green-50 text-green-700";
  }

  if (
    type === "updated" ||
    type === "wiki_updated" ||
    type === "ticket_updated" ||
    type === "ticket_comment_updated" ||
    type === "user_updated" ||
    type === "company_updated" ||
    type === "department_updated"
  ) {
    return "bg-blue-50 text-blue-700";
  }

  if (type === "commented") {
    return "bg-indigo-50 text-indigo-700";
  }

  if (
    type === "restored" ||
    type === "wiki_restored"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    type === "deleted" ||
    type === "wiki_deleted" ||
    type === "ticket_deleted" ||
    type === "ticket_comment_deleted" ||
    type === "user_deleted" ||
    type === "company_deleted" ||
    type === "department_deleted"
  ) {
    return "bg-red-50 text-red-700";
  }

  if (type === "settings_updated") {
    return "bg-zinc-100 text-zinc-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

export function getTypeLabel(
  type: ActivityType | string
) {
  return getActivityTypeLabel(
    type
  );
}

export function getTypeClass(
  type: ActivityType | string
) {
  return getActivityTypeClass(
    type
  );
}