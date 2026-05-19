export type AppDataSource =
  | "localStorage"
  | "api"
  | "database";

const DATA_SOURCE_STORAGE_KEY =
  "dms_data_source";

const DEFAULT_DATA_SOURCE: AppDataSource =
  "localStorage";

function normalizeDataSource(
  value: unknown
): AppDataSource {
  if (value === "api") {
    return "api";
  }

  if (value === "database") {
    return "database";
  }

  return "localStorage";
}

export function getDataSource(): AppDataSource {
  if (typeof window === "undefined") {
    return DEFAULT_DATA_SOURCE;
  }

  const raw =
    localStorage.getItem(
      DATA_SOURCE_STORAGE_KEY
    );

  return normalizeDataSource(
    raw
  );
}

export function saveDataSource(
  dataSource: AppDataSource
) {
  if (typeof window === "undefined") {
    return dataSource;
  }

  const normalizedDataSource =
    normalizeDataSource(
      dataSource
    );

  localStorage.setItem(
    DATA_SOURCE_STORAGE_KEY,
    normalizedDataSource
  );

  window.dispatchEvent(
    new Event("appSettingsUpdated")
  );

  window.dispatchEvent(
    new Event("dataUpdated")
  );

  return normalizedDataSource;
}

export function resetDataSource() {
  if (typeof window === "undefined") {
    return DEFAULT_DATA_SOURCE;
  }

  localStorage.removeItem(
    DATA_SOURCE_STORAGE_KEY
  );

  window.dispatchEvent(
    new Event("appSettingsUpdated")
  );

  window.dispatchEvent(
    new Event("dataUpdated")
  );

  return DEFAULT_DATA_SOURCE;
}

export function getDataSourceLabel(
  dataSource: AppDataSource
) {
  if (dataSource === "api") {
    return "API";
  }

  if (dataSource === "database") {
    return "Datenbank";
  }

  return "LocalStorage";
}

export function getDataSourceDescription(
  dataSource: AppDataSource
) {
  if (dataSource === "api") {
    return "Daten werden über API-Routen geladen und gespeichert.";
  }

  if (dataSource === "database") {
    return "Daten werden über eine echte Datenbank geladen und gespeichert.";
  }

  return "Daten werden lokal im Browser gespeichert.";
}

export function getDataSourceOptions() {
  return [
    {
      value:
        "localStorage" as AppDataSource,

      label:
        "LocalStorage",

      description:
        "Aktueller Demo-Modus mit lokalen Browser-Daten.",
    },
    {
      value:
        "api" as AppDataSource,

      label:
        "API",

      description:
        "Vorbereitung für Next.js API-Routen.",
    },
    {
      value:
        "database" as AppDataSource,

      label:
        "Datenbank",

      description:
        "Zielmodus für echte DB-Anbindung.",
    },
  ];
}