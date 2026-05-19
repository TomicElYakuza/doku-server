"use client";

import {
  useEffect,
} from "react";

import {
  useNotifications,
} from "../hooks/useNotifications";

import type {
  NotificationType,
} from "../lib/notificationHelpers";

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
    remove,
  } = useNotifications();

  useEffect(() => {
    if (notifications.length === 0) {
      return;
    }

    const timers =
      notifications
        .slice(
          0,
          5
        )
        .map(
          (notification) =>
            window.setTimeout(
              () => {
                remove(
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
    notifications,
    remove,
  ]);

  const visibleNotifications =
    notifications.slice(
      0,
      5
    );

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
                  remove(
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