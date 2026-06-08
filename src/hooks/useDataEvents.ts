"use client";

import {
  useEffect,
} from "react";

type DataEventGroup =
  | "wiki"
  | "tickets"
  | "news"
  | "files"
  | "comments"
  | "companies"
  | "departments"
  | "adminUsers"
  | "settings"
  | "activities"
  | "ticketTemplates";

type DataEventName =
  | "wikiPagesUpdated"
  | "ticketsUpdated"
  | "newsUpdated"
  | "filesUpdated"
  | "commentsUpdated"
  | "companiesUpdated"
  | "departmentsUpdated"
  | "adminUsersUpdated"
  | "appSettingsUpdated"
  | "activitiesUpdated"
  | "ticketTemplatesUpdated";

const eventsByGroup: Record<DataEventGroup, DataEventName[]> = {
  wiki: [
    "wikiPagesUpdated",
  ],

  tickets: [
    "ticketsUpdated",
  ],

  news: [
    "newsUpdated",
  ],

  files: [
    "filesUpdated",
  ],

  comments: [
    "commentsUpdated",
  ],

  companies: [
    "companiesUpdated",
  ],

  departments: [
    "departmentsUpdated",
  ],

  adminUsers: [
    "adminUsersUpdated",
  ],

  settings: [
    "appSettingsUpdated",
  ],

  activities: [
    "activitiesUpdated",
  ],

  ticketTemplates: [
    "ticketTemplatesUpdated",
  ],
};

export function getEventsForEntity(
  group: DataEventGroup
) {
  return eventsByGroup[group] || [];
}

export function useDataEvents(
  group: DataEventGroup,
  handler: () => void
) {
  useEffect(
    () => {
      const events =
        getEventsForEntity(
          group
        );

      events.forEach(
        (eventName) => {
          window.addEventListener(
            eventName,
            handler
          );
        }
      );

      return () => {
        events.forEach(
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
      group,
      handler,
    ]
  );
}

export function dispatchDataEvent(
  group: DataEventGroup
) {
  if (typeof window === "undefined") {
    return;
  }

  const events =
    getEventsForEntity(
      group
    );

  events.forEach(
    (eventName) => {
      window.dispatchEvent(
        new Event(
          eventName
        )
      );
    }
  );
}
