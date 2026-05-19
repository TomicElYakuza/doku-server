"use client";

import {
  useMemo,
} from "react";

import {
  getEventsForEntity,
} from "../lib/appEvents";

type DataEventGroup =
  | "wiki"
  | "ticket"
  | "ticketComment"
  | "ticketTemplate"
  | "activity"
  | "adminUser"
  | "company"
  | "department"
  | "settings"
  | "currentUser"
  | "storage"
  | "notifications";

export function useDataEvents(
  entity: DataEventGroup
) {
  return useMemo(
    () =>
      getEventsForEntity(
        entity
      ),
    [
      entity,
    ]
  );
}