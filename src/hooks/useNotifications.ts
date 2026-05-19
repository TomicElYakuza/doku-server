"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  clearNotifications,
  getNotifications,
  notifyError,
  notifyInfo,
  notifySuccess,
  notifyWarning,
  removeNotification,
} from "../lib/notificationHelpers";

import type {
  NotificationMessage,
} from "../lib/notificationHelpers";

export function useNotifications() {
  const [notifications, setNotifications] =
    useState<NotificationMessage[]>([]);

  const reload =
    useCallback(
      () => {
        setNotifications(
          getNotifications()
        );
      },
      []
    );

  useEffect(() => {
    reload();

    function handleNotificationsUpdated() {
      reload();
    }

    window.addEventListener(
      "notificationsUpdated",
      handleNotificationsUpdated
    );

    return () => {
      window.removeEventListener(
        "notificationsUpdated",
        handleNotificationsUpdated
      );
    };
  }, [
    reload,
  ]);

  return {
    notifications,

    reload,

    success:
      notifySuccess,

    error:
      notifyError,

    warning:
      notifyWarning,

    info:
      notifyInfo,

    remove:
      removeNotification,

    clear:
      clearNotifications,
  };
}