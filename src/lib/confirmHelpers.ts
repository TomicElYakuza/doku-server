export function confirmAction(
  message: string
) {
  if (typeof window === "undefined") {
    return false;
  }

  return window.confirm(
    message
  );
}

export function confirmDelete(
  label = "Eintrag"
) {
  return confirmAction(
    `${label} wirklich löschen?`
  );
}

export function confirmReset(
  label = "Daten"
) {
  return confirmAction(
    `${label} wirklich zurücksetzen?`
  );
}

export function confirmDangerAction(
  message: string,
  secondMessage = "Diese Aktion kann nicht rückgängig gemacht werden. Wirklich fortfahren?"
) {
  const firstConfirmed =
    confirmAction(
      message
    );

  if (!firstConfirmed) {
    return false;
  }

  return confirmAction(
    secondMessage
  );
}

export function confirmClearAllStorage() {
  return confirmDangerAction(
    "Wirklich alle lokalen DMS-Daten löschen?",
    "Letzte Bestätigung: Alle lokalen DMS-Daten werden entfernt."
  );
}

export function confirmImportStorage() {
  return confirmAction(
    "Import wirklich durchführen? Bestehende lokale DMS-Daten können überschrieben werden."
  );
}

export function confirmDeleteStorageKey(
  label: string
) {
  return confirmAction(
    `"${label}" wirklich aus dem lokalen Speicher löschen?`
  );
}

export function confirmDeleteTicket(
  title: string
) {
  return confirmAction(
    `Ticket "${title}" wirklich löschen?`
  );
}

export function confirmDeleteWikiPage(
  title: string
) {
  return confirmAction(
    `Wiki-Seite "${title}" wirklich löschen?`
  );
}

export function confirmDeleteUser(
  name: string
) {
  return confirmAction(
    `Benutzer "${name}" wirklich löschen?`
  );
}

export function confirmDeleteCompany(
  name: string
) {
  return confirmAction(
    `Firma "${name}" wirklich löschen? Alle zugehörigen Abteilungen werden ebenfalls entfernt.`
  );
}

export function confirmDeleteDepartment(
  name: string
) {
  return confirmAction(
    `Abteilung "${name}" wirklich löschen?`
  );
}

export function confirmDeleteTicketTemplate(
  title: string
) {
  return confirmAction(
    `Vorlage "${title}" wirklich löschen?`
  );
}

export function confirmDeleteActivity() {
  return confirmAction(
    "Aktivität wirklich löschen?"
  );
}

export function confirmClearActivities() {
  return confirmAction(
    "Alle Aktivitäten wirklich löschen?"
  );
}