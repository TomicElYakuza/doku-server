const STORAGE_KEY =
  "wiki-activities";

export function getActivities() {
  if (typeof window === "undefined") {
    return [];
  }

  const data =
    localStorage.getItem(STORAGE_KEY);

  return data
    ? JSON.parse(data)
    : [];
}

export function saveActivity(
  activity: any
) {
  const activities =
    getActivities();

  activities.unshift(activity);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      activities.slice(0, 20)
    )
  );
}