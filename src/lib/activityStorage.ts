const STORAGE_KEY = "wiki-activities";

const MAX_ACTIVITIES = 100;

export function getActivities() {
  if (typeof window === "undefined") {
    return [];
  }

  const data =
    localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return [];
  }

  try {
    const parsed = JSON.parse(data);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export function saveActivities(
  activities: any[]
) {
  if (typeof window === "undefined") {
    return;
  }

  const safeActivities =
    Array.isArray(activities)
      ? activities
      : [];

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      safeActivities.slice(
        0,
        MAX_ACTIVITIES
      )
    )
  );

  window.dispatchEvent(
    new Event("activityUpdated")
  );
}

export function saveActivity(
  activity: any
) {
  if (typeof window === "undefined") {
    return;
  }

  if (!activity) {
    return;
  }

  const activities =
    getActivities();

  const newActivity = {
    type:
      activity.type || "unknown",

    title:
      activity.title || "Ohne Titel",

    user:
      activity.user || "Unbekannt",

    createdAt:
      activity.createdAt ||
      new Date().toLocaleString(),
  };

  const updatedActivities = [
    newActivity,
    ...activities,
  ].slice(
    0,
    MAX_ACTIVITIES
  );

  saveActivities(
    updatedActivities
  );
}

export function clearActivities() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );

  window.dispatchEvent(
    new Event("activityUpdated")
  );
}