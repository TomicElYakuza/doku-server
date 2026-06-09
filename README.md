# DMS / Ticket / Intranet

Interne Intranet-Anwendung mit Dokumentation, Wiki, Tickets, News, Dateien, Aktivitäten, Berechtigungen und Admin-Backend.

Das Projekt basiert auf:

- Next.js
- React
- TypeScript
- PostgreSQL
- Tailwind CSS
- Node.js

## Projektstatus

Das Projekt ist PostgreSQL/API-basiert. Alte `localStorage`- und Fallback-Logik soll langfristig nicht mehr verwendet werden.

Aktuelle Kernmodule:

- Dashboard
- Tickets
- Ticket-Vorlagen
- Wiki
- News
- Dateien
- Aktivitäten / Audit Log
- Firmen und Abteilungen
- Benutzerverwaltung
- Rollen und Berechtigungen
- Rollen-Vorlagen
- Taxonomie für Kategorien und Tags
- App-/User-/Moduleinstellungen
- Admin-Datenbankstatus

## Voraussetzungen

Installiert sein müssen:

- Node.js
- npm
- PostgreSQL

## Installation

Repository klonen oder herunterladen:

```bash
git clone https://github.com/TomicElYakuza/doku-server.git
cd doku-server