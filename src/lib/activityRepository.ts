import {
  requestJson,
} from "./apiClient";

import type {
  Activity,
  ActivityCreateInput,
  ActivityInput,
  ActivityType,
} from "../types/activity";

export type ActivityRepository = {
  list: () => Promise<Activity[]>;
  search: (query: string) => Promise<Activity[]>;
  findById: (id: string) => Promise<Activity | null>;
  create: (activity: ActivityCreateInput) => Promise<Activity>;
  delete: (id: string) => Promise<void>;
  saveAll: (activities: ActivityInput[]) => Promise<void>;
  clear: () => Promise<void>;
  reset: () => Promise<void>;

  listByType: (type: ActivityType | string) => Promise<Activity[]>;
  listByEntity: (
    entityType: string,
    entityId: string
  ) => Promise<Activity[]>;
  listByCompanyId: (companyId: string) => Promise<Activity[]>;
  listByDepartmentId: (departmentId: string) => Promise<Activity[]>;

  countAll: () => Promise<number>;
  countByType: (type: ActivityType | string) => Promise<number>;

  getTypeLabel: (type: ActivityType | string) => string;
  getTypeClass: (type: ActivityType | string) => string;
};

function dispatchActivitiesUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(
      "activitiesUpdated"
    )
  );
}

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

export const postgresActivityRepository: ActivityRepository = {
  async list() {
    return requestJson<Activity[]>(
      "/api/activities"
    );
  },

  async search(
    query: string
  ) {
    const activities =
      await postgresActivityRepository.list();

    return activities.filter(
      (activity) =>
        activityMatchesQuery(
          activity,
          query
        )
    );
  },

  async findById(
    id: string
  ) {
    const activities =
      await postgresActivityRepository.list();

    return (
      activities.find(
        (activity) =>
          activity.id === id
      ) ||
      null
    );
  },

  async create(
    activity: ActivityCreateInput
  ) {
    const createdActivity =
      await requestJson<Activity>(
        "/api/activities",
        {
          method:
            "POST",

          body:
            JSON.stringify(
              activity
            ),
        }
      );

    dispatchActivitiesUpdated();

    return createdActivity;
  },

  async delete(
    id: string
  ) {
    if (!id) {
      return;
    }

    await requestJson<{
      ok: boolean;
    }>(
      `/api/activities/${encodeURIComponent(
        id
      )}`,
      {
        method:
          "DELETE",
      }
    );

    dispatchActivitiesUpdated();
  },

  async saveAll(
    activities: ActivityInput[]
  ) {
    await Promise.all(
      activities.map(
        async (activity) => {
          await postgresActivityRepository.create(
            activity
          );
        }
      )
    );

    dispatchActivitiesUpdated();
  },

  async clear() {
    throw new Error(
      "clear ist für PostgreSQL-Aktivitäten nicht direkt verfügbar."
    );
  },

  async reset() {
    throw new Error(
      "reset ist für PostgreSQL-Aktivitäten nicht direkt verfügbar."
    );
  },

  async listByType(
    type: ActivityType | string
  ) {
    return requestJson<Activity[]>(
      `/api/activities?type=${encodeURIComponent(
        String(
          type
        )
      )}`
    );
  },

  async listByEntity(
    entityType: string,
    entityId: string
  ) {
    return requestJson<Activity[]>(
      `/api/activities?entityType=${encodeURIComponent(
        entityType
      )}&entityId=${encodeURIComponent(
        entityId
      )}`
    );
  },

  async listByCompanyId(
    companyId: string
  ) {
    return requestJson<Activity[]>(
      `/api/activities?companyId=${encodeURIComponent(
        companyId
      )}`
    );
  },

  async listByDepartmentId(
    departmentId: string
  ) {
    return requestJson<Activity[]>(
      `/api/activities?departmentId=${encodeURIComponent(
        departmentId
      )}`
    );
  },

  async countAll() {
    const activities =
      await postgresActivityRepository.list();

    return activities.length;
  },

  async countByType(
    type: ActivityType | string
  ) {
    const activities =
      await postgresActivityRepository.listByType(
        type
      );

    return activities.length;
  },

  getTypeLabel(
    type: ActivityType | string
  ) {
    if (type === "created") {
      return "Erstellt";
    }

    if (type === "edited") {
      return "Bearbeitet";
    }

    if (type === "deleted") {
      return "Gelöscht";
    }

    if (type === "restored") {
      return "Wiederhergestellt";
    }

    if (type === "deletedForever") {
      return "Endgültig gelöscht";
    }

    return String(
      type ||
        "Aktivität"
    );
  },

  getTypeClass(
    type: ActivityType | string
  ) {
    if (type === "created") {
      return "bg-green-50 text-green-700";
    }

    if (type === "edited") {
      return "bg-blue-50 text-blue-700";
    }

    if (type === "deleted") {
      return "bg-red-50 text-red-700";
    }

    if (type === "restored") {
      return "bg-indigo-50 text-indigo-700";
    }

    if (type === "deletedForever") {
      return "bg-red-100 text-red-700";
    }

    return "bg-zinc-100 text-zinc-700";
  },
};

export const activityRepository =
  postgresActivityRepository;
