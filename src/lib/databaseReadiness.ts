export type DatabaseReadinessItem = {
  title: string;
  done: boolean;
  description: string;
};

export type DatabaseReadinessProgress = {
  total: number;
  done: number;
  open: number;
  percentage: number;
};

export function getDatabaseReadinessItems(): DatabaseReadinessItem[] {
  return [
    {
      title:
        "Zentrale DataEntity-Typen",

      done:
        true,

      description:
        "Alle Hauptbereiche sind als DataEntity vorbereitet.",
    },
    {
      title:
        "Adapter-Schicht",

      done:
        true,

      description:
        "LocalStorage-Adapter sind für Wiki, Tickets, Benutzer, Organisation, Aktivitäten, Settings und Notifications vorhanden.",
    },
    {
      title:
        "DataService",

      done:
        true,

      description:
        "CRUD läuft zentral über listData, getDataById, createData, updateData und deleteData.",
    },
    {
      title:
        "React Hooks",

      done:
        true,

      description:
        "useDataList, useDataItem und useDataActions sind vorbereitet.",
    },
    {
      title:
        "Events",

      done:
        true,

      description:
        "Datenänderungen lösen zentrale und entity-spezifische Events aus.",
    },
    {
      title:
        "Admin-Übersichten",

      done:
        true,

      description:
        "Adapter, Speicher, Benachrichtigungen und Datenbank-Readiness sind im Admin-Bereich sichtbar.",
    },
    {
      title:
        "API Client",

      done:
        true,

      description:
        "Grundlage für spätere Next.js API-Routen ist vorbereitet.",
    },
    {
      title:
        "Echte API-Routen",

      done:
        false,

      description:
        "Müssen später pro Bereich unter /api/... erstellt werden.",
    },
    {
      title:
        "Datenbank-Schema",

      done:
        false,

      description:
        "Muss später je nach Datenbank-Technologie erstellt werden.",
    },
    {
      title:
        "Authentifizierung",

      done:
        false,

      description:
        "Demo-Benutzer müssen später durch echte Sessions ersetzt werden.",
    },
  ];
}

export function getDatabaseReadinessProgress(): DatabaseReadinessProgress {
  const items =
    getDatabaseReadinessItems();

  const doneCount =
    items.filter(
      (item) =>
        item.done
    ).length;

  const total =
    items.length;

  const percentage =
    total > 0
      ? Math.round(
          (doneCount / total) * 100
        )
      : 0;

  return {
    total,

    done:
      doneCount,

    open:
      total - doneCount,

    percentage,
  };
}