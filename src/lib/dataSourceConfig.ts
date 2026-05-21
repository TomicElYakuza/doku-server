export type AppDataSource =
  "postgresql";

export function getDataSource(): AppDataSource {
  return "postgresql";
}

export function saveDataSource(
  _source: AppDataSource
) {
  return "postgresql";
}

export function getDataSourceLabel(
  _source?: AppDataSource
) {
  return "PostgreSQL";
}

export function getDataSourceDescription(
  _source?: AppDataSource
) {
  return "Die Anwendung verwendet PostgreSQL als zentrale Datenbank.";
}

export function getDataSourceOptions() {
  return [
    {
      value:
        "postgresql" as AppDataSource,

      label:
        "PostgreSQL",
    },
  ];
}