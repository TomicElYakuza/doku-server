import {
  dispatchAppEvent,
  dispatchNotificationsUpdated,
} from "./appEvents";

export type NotificationType =
  | "success"
  | "error"
  | "warning"
  | "info";

export type NotificationMessage = {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  createdAt: string;
};

const STORAGE_KEY =
  "dms_notifications";

const MAX_NOTIFICATIONS =
  100;

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

function normalizeNotification(
  notification: Partial<NotificationMessage>
): NotificationMessage {
  return {
    id:
      notification.id ||
      createId(),

    type:
      notification.type ||
      "info",

    title:
      notification.title ||
      "Hinweis",

    description:
      notification.description ||
      "",

    createdAt:
      notification.createdAt ||
      new Date().toLocaleString(),
  };
}

function limitNotifications(
  notifications: NotificationMessage[]
) {
  return notifications.slice(
    0,
    MAX_NOTIFICATIONS
  );
}

function dispatchNotificationStorageUpdated() {
  dispatchNotificationsUpdated();

  dispatchAppEvent(
    "storageManagerUpdated"
  );

  dispatchAppEvent(
    "dataUpdated"
  );
}

export function getNotifications(): NotificationMessage[] {
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

    return limitNotifications(
      parsed.map(
        (notification) =>
          normalizeNotification(
            notification
          )
      )
    );
  } catch {
    return [];
  }
}

export function saveNotifications(
  notifications: NotificationMessage[]
) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedNotifications =
    limitNotifications(
      notifications.map(
        (notification) =>
          normalizeNotification(
            notification
          )
      )
    );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      normalizedNotifications
    )
  );

  dispatchNotificationStorageUpdated();
}

export function addNotification(
  notification: Omit<
    NotificationMessage,
    "id" | "createdAt"
  >
) {
  const newNotification =
    normalizeNotification(
      notification
    );

  saveNotifications([
    newNotification,
    ...getNotifications(),
  ]);

  return newNotification;
}

export function removeNotification(
  id: string
) {
  saveNotifications(
    getNotifications().filter(
      (notification) =>
        notification.id !== id
    )
  );
}

export function clearNotifications() {
  saveNotifications([]);
}

export function notifySuccess(
  title: string,
  description?: string
) {
  return addNotification({
    type:
      "success",

    title,

    description,
  });
}

export function notifyError(
  title: string,
  description?: string
) {
  return addNotification({
    type:
      "error",

    title,

    description,
  });
}

export function notifyWarning(
  title: string,
  description?: string
) {
  return addNotification({
    type:
      "warning",

    title,

    description,
  });
}

export function notifyInfo(
  title: string,
  description?: string
) {
  return addNotification({
    type:
      "info",

    title,

    description,
  });
}