import {
  getEventsForEntity,
} from "./appEvents";

import type {
  AppEventName,
} from "./appEvents";

import type {
  DataEntity,
} from "./dataAdapter";

export function getEventsForDataEntity(
  entity: DataEntity
): AppEventName[] {
  if (entity === "wikiPage") {
    return getEventsForEntity(
      "wiki"
    );
  }

  if (entity === "ticket") {
    return getEventsForEntity(
      "ticket"
    );
  }

  if (entity === "ticketComment") {
    return getEventsForEntity(
      "ticketComment"
    );
  }

  if (entity === "ticketTemplate") {
    return getEventsForEntity(
      "ticketTemplate"
    );
  }

  if (entity === "activity") {
    return getEventsForEntity(
      "activity"
    );
  }

  if (entity === "adminUser") {
    return getEventsForEntity(
      "adminUser"
    );
  }

  if (entity === "company") {
    return getEventsForEntity(
      "company"
    );
  }

  if (entity === "department") {
    return getEventsForEntity(
      "department"
    );
  }

  if (entity === "settings") {
    return getEventsForEntity(
      "settings"
    );
  }

  if (entity === "currentUser") {
    return getEventsForEntity(
      "currentUser"
    );
  }

  if (entity === "notification") {
    return getEventsForEntity(
      "notifications"
    );
  }

  return [
    "dataUpdated",
  ];
}