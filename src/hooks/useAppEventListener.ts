"use client";

import {
  useEffect,
} from "react";

export type AppEventName =
  | "activitiesUpdated"
  | "adminUsersUpdated"
  | "appSettingsUpdated"
  | "commentsUpdated"
  | "companiesUpdated"
  | "currentUserUpdated"
  | "departmentsUpdated"
  | "filesUpdated"
  | "newsOpenedUpdated"
  | "newsUpdated"
  | "ticketTemplatesUpdated"
  | "ticketsUpdated"
  | "wikiPagesUpdated";

type AppEventHandler =
  () => void;

export function useAppEventListener(
  eventName: AppEventName,
  handler: AppEventHandler
) {
  useEffect(
    () => {
      window.addEventListener(
        eventName,
        handler
      );

      return () => {
        window.removeEventListener(
          eventName,
          handler
        );
      };
    },
    [
      eventName,
      handler,
    ]
  );
}

export function useAppEventListeners(
  eventNames: AppEventName[],
  handler: AppEventHandler
) {
  useEffect(
    () => {
      eventNames.forEach(
        (eventName) => {
          window.addEventListener(
            eventName,
            handler
          );
        }
      );

      return () => {
        eventNames.forEach(
          (eventName) => {
            window.removeEventListener(
              eventName,
              handler
            );
          }
        );
      };
    },
    [
      eventNames,
      handler,
    ]
  );
}

export function dispatchAppEvent(
  eventName: AppEventName
) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(
      eventName
    )
  );
}
