import {
  applyPagination,
  createErrorResult,
  createLocalStorageAdapterMeta,
  createSuccessListResult,
  createSuccessResult,
  matchesSearchQuery,
} from "./dataAdapter";

import type {
  DataAdapter,
  DataAdapterQuery,
} from "./dataAdapter";

import {
  deleteActivity,
  getActivities,
  getActivityById,
  saveActivity,
} from "./activityStorage";

import type {
  Activity,
  ActivityInput,
} from "./activityStorage";

function filterActivities(
  activities: Activity[],
  query?: DataAdapterQuery
) {
  if (!query) {
    return activities;
  }

  return activities.filter(
    (activity) => {
      const matchesSearch =
        matchesSearchQuery(
          [
            activity.title,
            activity.description,
            activity.type,
            activity.entityId,
            activity.entityType,
            activity.userName,
            activity.userEmail,
            activity.user,
            activity.company,
            activity.department,
          ],
          query.search
        );

      const matchesCompany =
        !query.companyId ||
        activity.companyId === query.companyId;

      const matchesDepartment =
        !query.departmentId ||
        activity.departmentId === query.departmentId;

      const matchesType =
        !query.type ||
        activity.type === query.type;

      const matchesEntityId =
        !query.entityId ||
        activity.entityId === query.entityId;

      const matchesEntityType =
        !query.entityType ||
        activity.entityType === query.entityType;

      return (
        matchesSearch &&
        matchesCompany &&
        matchesDepartment &&
        matchesType &&
        matchesEntityId &&
        matchesEntityType
      );
    }
  );
}

export const activityLocalStorageAdapter: DataAdapter<Activity> =
  {
    meta:
      createLocalStorageAdapterMeta(
        "activity",
        "dms_activities"
      ),

    async list(
      query?: DataAdapterQuery
    ) {
      try {
        const activities =
          getActivities();

        const filteredActivities =
          filterActivities(
            activities,
            query
          );

        return createSuccessListResult(
          applyPagination(
            filteredActivities,
            query
          )
        );
      } catch {
        return {
          success:
            false,

          data:
            [],

          error:
            "Aktivitäten konnten nicht geladen werden.",
        };
      }
    },

    async getById(
      id: string
    ) {
      try {
        return createSuccessResult(
          getActivityById(
            id
          )
        );
      } catch {
        return createErrorResult<Activity | null>(
          "Aktivität konnte nicht geladen werden."
        );
      }
    },

    async create(
      data: Omit<Activity, "id" | "createdAt" | "updatedAt">
    ) {
      try {
        const activity =
          saveActivity(
            data as ActivityInput
          );

        return createSuccessResult(
          activity
        );
      } catch {
        return createErrorResult<Activity>(
          "Aktivität konnte nicht erstellt werden."
        );
      }
    },

    async update(
      id: string,
      data: Partial<Activity>
    ) {
      try {
        const existingActivity =
          getActivityById(
            id
          );

        if (!existingActivity) {
          return createSuccessResult(
            null
          );
        }

        const updatedActivity =
          saveActivity({
            ...existingActivity,
            ...data,

            id:
              existingActivity.id,

            createdAt:
              existingActivity.createdAt,
          });

        return createSuccessResult(
          updatedActivity
        );
      } catch {
        return createErrorResult<Activity | null>(
          "Aktivität konnte nicht aktualisiert werden."
        );
      }
    },

    async delete(
      id: string
    ) {
      try {
        deleteActivity(
          id
        );

        return createSuccessResult(
          true
        );
      } catch {
        return createErrorResult<boolean>(
          "Aktivität konnte nicht gelöscht werden."
        );
      }
    },
  };

export function getActivityAdapter() {
  return activityLocalStorageAdapter;
}