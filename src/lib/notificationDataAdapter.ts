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
  addNotification,
  getNotifications,
  removeNotification,
  saveNotifications,
} from "./notificationHelpers";

import type {
  NotificationMessage,
} from "./notificationHelpers";

function filterNotifications(
  notifications: NotificationMessage[],
  query?: DataAdapterQuery
) {
  if (!query) {
    return notifications;
  }

  return notifications.filter(
    (notification) => {
      const matchesSearch =
        matchesSearchQuery(
          [
            notification.title,
            notification.description,
            notification.type,
            notification.createdAt,
          ],
          query.search
        );

      const matchesType =
        !query.type ||
        notification.type === query.type;

      return (
        matchesSearch &&
        matchesType
      );
    }
  );
}

export const notificationLocalStorageAdapter: DataAdapter<NotificationMessage> =
  {
    meta:
      createLocalStorageAdapterMeta(
        "notification",
        "dms_notifications"
      ),

    async list(
      query?: DataAdapterQuery
    ) {
      try {
        const notifications =
          getNotifications();

        const filteredNotifications =
          filterNotifications(
            notifications,
            query
          );

        return createSuccessListResult(
          applyPagination(
            filteredNotifications,
            query
          )
        );
      } catch {
        return createErrorListResultFallback();
      }
    },

    async getById(
      id: string
    ) {
      try {
        const notification =
          getNotifications().find(
            (item) =>
              item.id === id
          ) || null;

        return createSuccessResult(
          notification
        );
      } catch {
        return createErrorResult<NotificationMessage | null>(
          "Benachrichtigung konnte nicht geladen werden."
        );
      }
    },

    async create(
      data
    ) {
      try {
        const notification =
          addNotification(
            data
          );

        return createSuccessResult(
          notification
        );
      } catch {
        return createErrorResult<NotificationMessage>(
          "Benachrichtigung konnte nicht erstellt werden."
        );
      }
    },

    async update(
      id: string,
      data: Partial<NotificationMessage>
    ) {
      try {
        const notifications =
          getNotifications();

        const existingNotification =
          notifications.find(
            (item) =>
              item.id === id
          );

        if (!existingNotification) {
          return createSuccessResult(
            null
          );
        }

        const updatedNotification: NotificationMessage = {
          ...existingNotification,
          ...data,

          id:
            existingNotification.id,

          createdAt:
            existingNotification.createdAt,
        };

        const nextNotifications =
          notifications.map(
            (item) =>
              item.id === id
                ? updatedNotification
                : item
          );

        saveNotifications(
          nextNotifications
        );

        return createSuccessResult(
          updatedNotification
        );
      } catch {
        return createErrorResult<NotificationMessage | null>(
          "Benachrichtigung konnte nicht aktualisiert werden."
        );
      }
    },

    async delete(
      id: string
    ) {
      try {
        removeNotification(
          id
        );

        return createSuccessResult(
          true
        );
      } catch {
        return createErrorResult<boolean>(
          "Benachrichtigung konnte nicht gelöscht werden."
        );
      }
    },
  };

function createErrorListResultFallback() {
  return {
    success:
      false,

    data:
      [],

    error:
      "Benachrichtigungen konnten nicht geladen werden.",
  };
}

export function getNotificationAdapter() {
  return notificationLocalStorageAdapter;
}