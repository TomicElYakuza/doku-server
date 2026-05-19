import type {
  DataEntity,
} from "./dataAdapter";

export type AppEventName =
  | "wikiPagesUpdated"
  | "ticketsUpdated"
  | "ticketCommentsUpdated"
  | "ticketTemplatesUpdated"
  | "activityUpdated"
  | "adminUsersUpdated"
  | "companiesUpdated"
  | "departmentsUpdated"
  | "appSettingsUpdated"
  | "userUpdated"
  | "storageManagerUpdated"
  | "notificationsUpdated"
  | "dataUpdated";

export const appEvents: Record<AppEventName, AppEventName> = {
  wikiPagesUpdated:
    "wikiPagesUpdated",

  ticketsUpdated:
    "ticketsUpdated",

  ticketCommentsUpdated:
    "ticketCommentsUpdated",

  ticketTemplatesUpdated:
    "ticketTemplatesUpdated",

  activityUpdated:
    "activityUpdated",

  adminUsersUpdated:
    "adminUsersUpdated",

  companiesUpdated:
    "companiesUpdated",

  departmentsUpdated:
    "departmentsUpdated",

  appSettingsUpdated:
    "appSettingsUpdated",

  userUpdated:
    "userUpdated",

  storageManagerUpdated:
    "storageManagerUpdated",

  notificationsUpdated:
    "notificationsUpdated",

  dataUpdated:
    "dataUpdated",
};

export const allAppEventNames: AppEventName[] = [
  "wikiPagesUpdated",
  "ticketsUpdated",
  "ticketCommentsUpdated",
  "ticketTemplatesUpdated",
  "activityUpdated",
  "adminUsersUpdated",
  "companiesUpdated",
  "departmentsUpdated",
  "appSettingsUpdated",
  "userUpdated",
  "storageManagerUpdated",
  "notificationsUpdated",
  "dataUpdated",
];

export function getEventForDataEntity(
  entity: DataEntity
): AppEventName {
  if (entity === "wikiPage") {
    return "wikiPagesUpdated";
  }

  if (entity === "ticket") {
    return "ticketsUpdated";
  }

  if (entity === "ticketComment") {
    return "ticketCommentsUpdated";
  }

  if (entity === "ticketTemplate") {
    return "ticketTemplatesUpdated";
  }

  if (entity === "activity") {
    return "activityUpdated";
  }

  if (entity === "adminUser") {
    return "adminUsersUpdated";
  }

  if (entity === "company") {
    return "companiesUpdated";
  }

  if (entity === "department") {
    return "departmentsUpdated";
  }

  if (entity === "settings") {
    return "appSettingsUpdated";
  }

  if (entity === "currentUser") {
    return "userUpdated";
  }

  return "dataUpdated";
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

export function dispatchDataUpdated() {
  dispatchAppEvent(
    "dataUpdated"
  );
}

export function dispatchNotificationsUpdated() {
  dispatchAppEvent(
    "notificationsUpdated"
  );
}

export function dispatchDataEntityUpdated(
  entity: DataEntity
) {
  dispatchAppEvent(
    getEventForDataEntity(
      entity
    )
  );

  dispatchDataUpdated();
}

export function dispatchMultipleAppEvents(
  eventNames: AppEventName[]
) {
  eventNames.forEach(
    (eventName) => {
      dispatchAppEvent(
        eventName
      );
    }
  );
}

export function dispatchAllAppEvents() {
  dispatchMultipleAppEvents(
    allAppEventNames
  );
}

export function addAppEventListener(
  eventName: AppEventName,
  handler: EventListener
) {
  if (typeof window === "undefined") {
    return () => {};
  }

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
}

export function addMultipleAppEventListeners(
  eventNames: AppEventName[],
  handler: EventListener
) {
  if (typeof window === "undefined") {
    return () => {};
  }

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
}

export function getEventsForEntity(
  entity:
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
    | "notifications"
) {
  if (entity === "wiki") {
    return [
      appEvents.wikiPagesUpdated,
      appEvents.dataUpdated,
    ];
  }

  if (entity === "ticket") {
    return [
      appEvents.ticketsUpdated,
      appEvents.dataUpdated,
    ];
  }

  if (entity === "ticketComment") {
    return [
      appEvents.ticketCommentsUpdated,
      appEvents.dataUpdated,
    ];
  }

  if (entity === "ticketTemplate") {
    return [
      appEvents.ticketTemplatesUpdated,
      appEvents.dataUpdated,
    ];
  }

  if (entity === "activity") {
    return [
      appEvents.activityUpdated,
      appEvents.dataUpdated,
    ];
  }

  if (entity === "adminUser") {
    return [
      appEvents.adminUsersUpdated,
      appEvents.dataUpdated,
    ];
  }

  if (entity === "company") {
    return [
      appEvents.companiesUpdated,
      appEvents.dataUpdated,
    ];
  }

  if (entity === "department") {
    return [
      appEvents.departmentsUpdated,
      appEvents.dataUpdated,
    ];
  }

  if (entity === "settings") {
    return [
      appEvents.appSettingsUpdated,
      appEvents.dataUpdated,
    ];
  }

  if (entity === "currentUser") {
    return [
      appEvents.userUpdated,
      appEvents.dataUpdated,
    ];
  }

  if (entity === "storage") {
    return [
      appEvents.storageManagerUpdated,
      appEvents.dataUpdated,
    ];
  }

  if (entity === "notifications") {
    return [
      appEvents.notificationsUpdated,
      appEvents.dataUpdated,
    ];
  }

  return [
    appEvents.dataUpdated,
  ];
}