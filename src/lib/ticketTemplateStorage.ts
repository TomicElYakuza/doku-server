import type {
  TicketPriority,
  TicketStatus,
} from "./ticketStorage";

export type TicketTemplate = {
  id: string;
  title: string;
  description: string;
  company: string;
  category: string;
  assignedTo: string;
  status: TicketStatus;
  priority: TicketPriority;
};

const STORAGE_KEY =
  "dms_ticket_templates";

const defaultTemplates: TicketTemplate[] = [
  {
    id: "template-vpn-problem",

    title:
      "VPN Verbindung funktioniert nicht",

    description:
      "Benutzer kann keine VPN-Verbindung herstellen.\n\nBitte prüfen:\n- Internetverbindung\n- VPN-Client\n- Zugangsdaten\n- Zertifikat\n- Firewall / Netzwerkfreigabe",

    company:
      "Intern",

    category:
      "IT",

    assignedTo:
      "IT Support",

    status:
      "open",

    priority:
      "high",
  },

  {
    id: "template-drucker-problem",

    title:
      "Drucker druckt nicht",

    description:
      "Der Drucker reagiert nicht oder Druckaufträge bleiben hängen.\n\nBitte prüfen:\n- Druckerstatus\n- Verbindung / Netzwerk\n- Papier / Toner\n- Druckerwarteschlange\n- Treiber",

    company:
      "Intern",

    category:
      "Support",

    assignedTo:
      "IT Support",

    status:
      "open",

    priority:
      "medium",
  },

  {
    id: "template-benutzer-anlegen",

    title:
      "Neuen Benutzer anlegen",

    description:
      "Ein neuer Benutzer soll im System angelegt werden.\n\nBenötigte Daten:\n- Vorname / Nachname\n- E-Mail-Adresse\n- Abteilung\n- Rolle / Berechtigungen\n- Startdatum",

    company:
      "Intern",

    category:
      "HR / IT",

    assignedTo:
      "Admin",

    status:
      "open",

    priority:
      "medium",
  },

  {
    id: "template-passwort-reset",

    title:
      "Passwort zurücksetzen",

    description:
      "Benutzer benötigt einen Passwort-Reset.\n\nBitte prüfen:\n- Benutzeridentität\n- betroffener Account\n- temporäres Passwort / Reset-Link\n- Benutzer informieren",

    company:
      "Intern",

    category:
      "IT",

    assignedTo:
      "IT Support",

    status:
      "open",

    priority:
      "medium",
  },

  {
    id: "template-zugriff-anfordern",

    title:
      "Zugriff auf Ordner / System anfordern",

    description:
      "Benutzer benötigt Zugriff auf einen Ordner oder ein System.\n\nBitte angeben:\n- Gewünschter Ordner / System\n- Benötigte Berechtigungsstufe\n- Begründung\n- Freigabe durch Vorgesetzten",

    company:
      "Intern",

    category:
      "Berechtigungen",

    assignedTo:
      "Admin",

    status:
      "open",

    priority:
      "medium",
  },

  {
    id: "template-hardware-defekt",

    title:
      "Hardware defekt",

    description:
      "Ein Gerät funktioniert nicht mehr korrekt.\n\nBitte prüfen:\n- Gerätetyp\n- Seriennummer\n- Fehlerbeschreibung\n- Garantie / Ersatzgerät\n- weitere Schritte",

    company:
      "Intern",

    category:
      "Hardware",

    assignedTo:
      "IT Support",

    status:
      "open",

    priority:
      "high",
  },

  {
    id: "template-software-installation",

    title:
      "Software installieren",

    description:
      "Benutzer benötigt eine Softwareinstallation.\n\nBitte angeben:\n- Software-Name\n- Version\n- Lizenz vorhanden?\n- Gerät / Benutzer\n- Freigabe notwendig?",

    company:
      "Intern",

    category:
      "Software",

    assignedTo:
      "IT Support",

    status:
      "open",

    priority:
      "low",
  },
];

function dispatchTemplatesUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("ticketTemplatesUpdated")
  );
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function getTicketTemplates(): TicketTemplate[] {
  if (typeof window === "undefined") {
    return defaultTemplates;
  }

  const raw =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!raw) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        defaultTemplates
      )
    );

    return defaultTemplates;
  }

  try {
    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return defaultTemplates;
    }

    return parsed;
  } catch {
    return defaultTemplates;
  }
}

export function saveTicketTemplates(
  templates: TicketTemplate[]
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      templates
    )
  );

  dispatchTemplatesUpdated();
}

export function resetTicketTemplates() {
  saveTicketTemplates(
    defaultTemplates
  );
}

export function getTicketTemplateById(
  id: string
) {
  const templates =
    getTicketTemplates();

  return (
    templates.find(
      (template) =>
        template.id === id
    ) || null
  );
}

export function createTicketTemplate(
  template: Omit<TicketTemplate, "id">
) {
  const templates =
    getTicketTemplates();

  const newTemplate: TicketTemplate = {
    ...template,

    id:
      createId(),
  };

  saveTicketTemplates([
    newTemplate,
    ...templates,
  ]);

  return newTemplate;
}

export function updateTicketTemplate(
  id: string,
  updates: Partial<TicketTemplate>
): TicketTemplate | null {
  const templates =
    getTicketTemplates();

  let updatedTemplate:
    | TicketTemplate
    | null = null;

  const updatedTemplates: TicketTemplate[] =
    templates.map(
      (template) => {
        if (template.id !== id) {
          return template;
        }

        const nextTemplate: TicketTemplate = {
          ...template,
          ...updates,

          id:
            template.id,
        };

        updatedTemplate =
          nextTemplate;

        return nextTemplate;
      }
    );

  saveTicketTemplates(
    updatedTemplates
  );

  return updatedTemplate;
}

export function deleteTicketTemplate(
  id: string
) {
  const templates =
    getTicketTemplates();

  const updatedTemplates =
    templates.filter(
      (template) =>
        template.id !== id
    );

  saveTicketTemplates(
    updatedTemplates
  );
}