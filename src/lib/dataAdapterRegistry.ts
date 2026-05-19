import {
  getTicketAdapter,
} from "./ticketDataAdapter";

import {
  getWikiAdapter,
} from "./wikiDataAdapter";

import {
  getAdminUserAdapter,
} from "./adminUserDataAdapter";

import {
  getCompanyAdapter,
  getDepartmentAdapter,
} from "./organizationDataAdapter";

import {
  getActivityAdapter,
} from "./activityDataAdapter";

import {
  getTicketCommentAdapter,
  getTicketTemplateAdapter,
} from "./ticketSupportDataAdapters";

import {
  getCurrentUserAdapter,
  getSettingsAdapter,
} from "./systemDataAdapters";

import {
  createNotImplementedAdapter,
} from "./dataAdapter";

import type {
  DataAdapter,
  DataEntity,
} from "./dataAdapter";

type AdapterRegistry = Record<
  DataEntity,
  DataAdapter<unknown>
>;

export const dataAdapterRegistry: AdapterRegistry = {
  wikiPage:
    getWikiAdapter() as DataAdapter<unknown>,

  ticket:
    getTicketAdapter() as DataAdapter<unknown>,

  ticketComment:
    getTicketCommentAdapter() as DataAdapter<unknown>,

  ticketTemplate:
    getTicketTemplateAdapter() as DataAdapter<unknown>,

  activity:
    getActivityAdapter() as DataAdapter<unknown>,

  adminUser:
    getAdminUserAdapter() as DataAdapter<unknown>,

  company:
    getCompanyAdapter() as DataAdapter<unknown>,

  department:
    getDepartmentAdapter() as DataAdapter<unknown>,

  settings:
    getSettingsAdapter() as DataAdapter<unknown>,

  currentUser:
    getCurrentUserAdapter() as DataAdapter<unknown>,
};

export function getDataAdapter<T>(
  entity: DataEntity
): DataAdapter<T> {
  const adapter =
    dataAdapterRegistry[
      entity
    ];

  if (!adapter) {
    return createNotImplementedAdapter<T>(
      entity
    );
  }

  return adapter as DataAdapter<T>;
}

export function getDataAdapterMeta(
  entity: DataEntity
) {
  return getDataAdapter(
    entity
  ).meta;
}

export function getAllDataAdapterMeta() {
  return Object.values(
    dataAdapterRegistry
  ).map(
    (adapter) =>
      adapter.meta
  );
}

export function getLocalStorageAdapterCount() {
  return getAllDataAdapterMeta().filter(
    (meta) =>
      meta.mode === "localStorage"
  ).length;
}

export function getApiAdapterCount() {
  return getAllDataAdapterMeta().filter(
    (meta) =>
      meta.mode === "api"
  ).length;
}

export function getDatabaseAdapterCount() {
  return getAllDataAdapterMeta().filter(
    (meta) =>
      meta.mode === "database"
  ).length;
}

export function getAdapterSourceLabel(
  entity: DataEntity
) {
  const meta =
    getDataAdapterMeta(
      entity
    );

  if (meta.mode === "localStorage") {
    return `LocalStorage: ${meta.source}`;
  }

  if (meta.mode === "api") {
    return `API: ${meta.source}`;
  }

  if (meta.mode === "database") {
    return `Datenbank: ${meta.source}`;
  }

  return meta.source;
}