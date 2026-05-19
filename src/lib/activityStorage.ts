export type ActivityType =
  | "created"
  | "edited"
  | "deleted"
  | "deletedForever"
  | "restored"
  | "uploaded"
  | "fileDeleted"
  | "commented"
  | "commentDeleted"
  | "ticketCreated"
  | "ticketUpdated"
  | "ticketDeleted"
  | "ticketCommented"
  | "ticketCommentUpdated"
  | "ticketCommentDeleted"
  | "ticketTemplateCreated"
  | "ticketTemplateUpdated"
  | "ticketTemplateDeleted"
  | "ticketTemplateReset";

export type Activity = {
  id?: string;
  type: ActivityType | string;
  title: string;
  company?: string;
  user?: string;
  createdAt: string;
};

const STORAGE_KEY =
  "dms_activities";

function dispatchActivityUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("activityUpdated")
  );
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

export function getActivities(): Activity[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!raw) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export function saveActivities(
  activities: Activity[]
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      activities
    )
  );

  dispatchActivityUpdated();
}

export function saveActivity(
  activity: Activity
) {
  const activities =
    getActivities();

  const nextActivity: Activity = {
    id:
      activity.id ||
      createId(),

    type:
      activity.type ||
      "edited",

    title:
      activity.title ||
      "Ohne Titel",

    company:
      activity.company ||
      "Intern",

    user:
      activity.user ||
      "Unbekannt",

    createdAt:
      activity.createdAt ||
      new Date().toLocaleString(),
  };

  saveActivities([
    nextActivity,
    ...activities,
  ]);

  return nextActivity;
}

export function deleteActivity(
  id: string
) {
  const activities =
    getActivities();

  const updatedActivities =
    activities.filter(
      (activity) =>
        activity.id !== id
    );

  saveActivities(
    updatedActivities
  );
}

export function clearActivities() {
  saveActivities([]);
}