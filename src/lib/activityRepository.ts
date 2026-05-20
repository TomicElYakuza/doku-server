import {
  clearActivities,
  createActivity,
  deleteActivity,
  getActivities,
  getActivitiesByCompanyId,
  getActivitiesByDepartmentId,
  getActivitiesByEntity,
  getActivitiesByType,
  getActivityById,
  getActivityTypeClass,
  getActivityTypeLabel,
  resetActivities,
  saveActivities,
} from "./activityStorage";

import type {
  Activity,
  ActivityInput,
  ActivityType,
} from "./activityStorage";

export type ActivityCreateInput =
  ActivityInput;

export type ActivityRepository = {
  list: () => Activity[];
  search: (query: string) => Activity[];
  findById: (id: string) => Activity | null;
  create: (activity: ActivityCreateInput) => Activity;
  delete: (id: string) => void;
  saveAll: (activities: ActivityInput[]) => void;
  clear: () => void;
  reset: () => void;

  listByType: (type: ActivityType | string) => Activity[];
  listByEntity: (
    entityType: string,
    entityId: string
  ) => Activity[];
  listByCompanyId: (companyId: string) => Activity[];
  listByDepartmentId: (departmentId: string) => Activity[];

  countAll: () => number;
  countByType: (type: ActivityType | string) => number;

  getTypeLabel: (type: ActivityType | string) => string;
  getTypeClass: (type: ActivityType | string) => string;
};

function activityMatchesQuery(
  activity: Activity,
  query: string
) {
  const normalizedQuery =
    query
      .trim()
      .toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    activity.id,
    activity.type,
    activity.title,
    activity.description,
    activity.entityId,
    activity.entityType,
    activity.userName,
    activity.userEmail,
    activity.user,
    activity.companyId,
    activity.departmentId,
    activity.company,
    activity.department,
    activity.createdAt,
    JSON.stringify(
      activity.metadata ||
        {}
    ),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(
    normalizedQuery
  );
}

export const localActivityRepository: ActivityRepository = {
  list() {
    return getActivities();
  },

  search(
    query: string
  ) {
    return getActivities().filter(
      (activity) =>
        activityMatchesQuery(
          activity,
          query
        )
    );
  },

  findById(
    id: string
  ) {
    return getActivityById(
      id
    );
  },

  create(
    activity: ActivityCreateInput
  ) {
    return createActivity(
      activity
    );
  },

  delete(
    id: string
  ) {
    deleteActivity(
      id
    );
  },

  saveAll(
    activities: ActivityInput[]
  ) {
    saveActivities(
      activities
    );
  },

  clear() {
    clearActivities();
  },

  reset() {
    resetActivities();
  },

  listByType(
    type: ActivityType | string
  ) {
    return getActivitiesByType(
      type
    );
  },

  listByEntity(
    entityType: string,
    entityId: string
  ) {
    return getActivitiesByEntity(
      entityType,
      entityId
    );
  },

  listByCompanyId(
    companyId: string
  ) {
    return getActivitiesByCompanyId(
      companyId
    );
  },

  listByDepartmentId(
    departmentId: string
  ) {
    return getActivitiesByDepartmentId(
      departmentId
    );
  },

  countAll() {
    return getActivities().length;
  },

  countByType(
    type: ActivityType | string
  ) {
    return getActivitiesByType(
      type
    ).length;
  },

  getTypeLabel(
    type: ActivityType | string
  ) {
    return getActivityTypeLabel(
      type
    );
  },

  getTypeClass(
    type: ActivityType | string
  ) {
    return getActivityTypeClass(
      type
    );
  },
};

export const activityRepository =
  localActivityRepository;