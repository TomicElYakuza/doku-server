"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNotifications,
} from "../hooks/useNotifications";

import type {
  NotificationType,
} from "../lib/notificationHelpers";

const DISMISSED_STORAGE_KEY =
  "dms_dismissed_notifications";

function getDismissedIds() {
  if (typeof window === "undefined") {
    return [];
  }

  const raw =
    sessionStorage.getItem(
      DISMISSED_STORAGE_KEY
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

    return parsed.map(
      (item) =>
        String(item)
    );
  } catch {
    return [];
  }
}

function saveDismissedIds(
  ids: string[]
) {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(
    DISMISSED_STORAGE_KEY,
    JSON.stringify(
      ids
    )
  );
}

function getNotificationClass(
  type: NotificationType
) {
  if (type === "success") {
    return "border-green-200 bg-green-50 text-green-900";
  }

  if (type === "error") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  if (type === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-blue-200 bg-blue-50 text-blue-900";
}

function getNotificationIcon(
  type: NotificationType
) {
  if (type === "success") {
    return "✓";
  }

  if (type === "error") {
    return "!";
  }

  if (type === "warning") {
    return "!";
  }

  return "i";
}

export default function NotificationCenter() {
  const {
    notifications,
  } = useNotifications();

  const [dismissedIds, setDismissedIds] =
    useState<string[]>([]);

  useEffect(() => {
    setDismissedIds(
      getDismissedIds()
    );
  }, []);

  function dismissNotification(
    id: string
  ) {
    setDismissedIds(
      (currentIds) => {
        const nextIds =
          Array.from(
            new Set([
              ...currentIds,
              id,
            ])
          );

        saveDismissedIds(
          nextIds
        );

        return nextIds;
      }
    );
  }

  const visibleNotifications =
    useMemo(
      () =>
        notifications
          .filter(
            (notification) =>
              !dismissedIds.includes(
                notification.id
              )
          )
          .slice(
            0,
            5
          ),
      [
        notifications,
        dismissedIds,
      ]
    );

  useEffect(() => {
    if (visibleNotifications.length === 0) {
      return;
    }

    const timers =
      visibleNotifications.map(
        (notification) =>
          window.setTimeout(
            () => {
              dismissNotification(
                notification.id
              );
            },
            6000
          )
      );

    return () => {
      timers.forEach(
        (timer) => {
          window.clearTimeout(
            timer
          );
        }
      );
    };
  }, [
    visibleNotifications,
  ]);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-6 top-6 z-50 w-full max-w-sm space-y-3">
      {visibleNotifications.map(
        (notification) => (
          <div
            key={notification.id}
            className={`rounded-3xl border p-4 shadow-lg backdrop-blur ${getNotificationClass(
              notification.type
            )}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/70 font-bold">
                {getNotificationIcon(
                  notification.type
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {notification.title}
                </p>

                {notification.description && (
                  <p className="mt-1 text-sm opacity-80">
                    {notification.description}
                  </p>
                )}

                <p className="mt-2 text-xs opacity-60">
                  {notification.createdAt}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  dismissNotification(
                    notification.id
                  )
                }
                className="rounded-xl px-2 py-1 text-sm opacity-60 hover:bg-white/50 hover:opacity-100 transition"
                aria-label="Benachrichtigung schließen"
              >
                ×
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}