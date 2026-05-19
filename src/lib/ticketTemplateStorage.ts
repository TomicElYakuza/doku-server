export type TicketTemplatePriority =
  | "low"
  | "medium"
  | "high"
  | "urgent";

export type TicketTemplateStatus =
  | "open"
  | "in_progress"
  | "waiting"
  | "done"
  | "closed";

export type TicketTemplate = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: TicketTemplatePriority;
  status: TicketTemplateStatus;

  companyId?: string;
  departmentId?: string;
  company?: string;
  department?: string;

  assignedTo?: string;
  tags?: string[];

  createdAt: string;
  updatedAt: string;
};

type OrganizationReference = {
  companyId?: string;
  departmentId?: string;
  company?: string;
  department?: string;
};

const STORAGE_KEY =
  "dms_ticket_templates";

const defaultTicketTemplates: TicketTemplate[] = [
  {
    id:
      "template-new-user",

    title:
      "Neuen Benutzer anlegen",

    description:
      "Benutzerkonto, Berechtigungen, Wiki-Zugriff und Standardgruppen vorbereiten.",

    category:
      "Benutzer",

    priority:
      "medium",

    status:
      "open",

    companyId:
      "company-intern",

    departmentId:
      "department-it",

    company:
      "Intern",

    department:
      "IT",

    assignedTo:
      "Admin",

    tags:
      [
        "benutzer",
        "onboarding",
      ],

    createdAt:
      new Date().toLocaleString(),

    updatedAt:
      new Date().toLocaleString(),
  },

  {
    id:
      "template-printer",

    title:
      "Druckerproblem prüfen",

    description:
      "Druckerstatus, Netzwerkverbindung, Treiber und Warteschlange prüfen.",

    category:
      "IT",

    priority:
      "high",

    status:
      "open",

    companyId:
      "company-intern",

    departmentId:
      "department-support",

    company:
      "Intern",

    department:
      "Support",

    assignedTo:
      "Admin",

    tags:
      [
        "drucker",
        "support",
      ],

    createdAt:
      new Date().toLocaleString(),

    updatedAt:
      new Date().toLocaleString(),
  },

  {
    id:
      "template-documentation",

    title:
      "Dokumentation aktualisieren",

    description:
      "Bestehende Wiki-Dokumentation prüfen, aktualisieren und Änderungen protokollieren.",

    category:
      "Dokumentation",

    priority:
      "low",

    status:
      "open",

    companyId:
      "company-intern",

    departmentId:
      "department-office",

    company:
      "Intern",

    department:
      "Office",

    assignedTo:
      "Editor",

    tags:
      [
        "wiki",
        "dokumentation",
      ],

    createdAt:
      new Date().toLocaleString(),

    updatedAt:
      new Date().toLocaleString(),
  },
];

function dispatchTicketTemplatesUpdated() {
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

function normalizePriority(
  value: unknown
): TicketTemplatePriority {
  if (value === "low") {
    return "low";
  }

  if (value === "medium") {
    return "medium";
  }

  if (value === "high") {
    return "high";
  }

  if (value === "urgent") {
    return "urgent";
  }

  return "medium";
}

function normalizeStatus(
  value: unknown
): TicketTemplateStatus {
  if (value === "open") {
    return "open";
  }

  if (value === "in_progress") {
    return "in_progress";
  }

  if (value === "waiting") {
    return "waiting";
  }

  if (value === "done") {
    return "done";
  }

  if (value === "closed") {
    return "closed";
  }

  return "open";
}

function normalizeTags(
  value: unknown
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(
      (tag) =>
        String(tag).trim()
    )
    .filter(Boolean);
}

function normalizeOrganizationReference(
  reference: OrganizationReference
): OrganizationReference {
  return {
    companyId:
      reference.companyId || "",

    departmentId:
      reference.departmentId || "",

    company:
      reference.company ||
      "Intern",

    department:
      reference.department ||
      "Allgemein",
  };
}

function normalizeTemplate(
  template: Partial<TicketTemplate>
): TicketTemplate {
  const now =
    new Date().toLocaleString();

  const organization =
    normalizeOrganizationReference({
      companyId:
        template.companyId,

      departmentId:
        template.departmentId,

      company:
        template.company,

      department:
        template.department,
    });

  return {
    id:
      template.id ||
      createId(),

    title:
      template.title ||
      "Unbenannte Vorlage",

    description:
      template.description ||
      "",

    category:
      template.category ||
      "Allgemein",

    priority:
      normalizePriority(
        template.priority
      ),

    status:
      normalizeStatus(
        template.status
      ),

    companyId:
      organization.companyId,

    departmentId:
      organization.departmentId,

    company:
      organization.company,

    department:
      organization.department,

    assignedTo:
      template.assignedTo ||
      "",

    tags:
      normalizeTags(
        template.tags
      ),

    createdAt:
      template.createdAt ||
      now,

    updatedAt:
      template.updatedAt ||
      now,
  };
}

export function getTicketTemplates(): TicketTemplate[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!raw) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        defaultTicketTemplates
      )
    );

    return defaultTicketTemplates.map(
      (template) =>
        normalizeTemplate(
          template
        )
    );
  }

  try {
    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(
      (template) =>
        normalizeTemplate(
          template
        )
    );
  } catch {
    return [];
  }
}

export function saveTicketTemplates(
  templates: TicketTemplate[]
) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedTemplates =
    templates.map(
      (template) =>
        normalizeTemplate(
          template
        )
    );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      normalizedTemplates
    )
  );

  dispatchTicketTemplatesUpdated();
}

export function resetTicketTemplates() {
  saveTicketTemplates(
    defaultTicketTemplates
  );
}

export function clearTicketTemplates() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );

  dispatchTicketTemplatesUpdated();
}

export function getTicketTemplateById(
  id: string
): TicketTemplate | null {
  return (
    getTicketTemplates().find(
      (template) =>
        template.id === id
    ) || null
  );
}

export function createTicketTemplate(
  template: Omit<
    TicketTemplate,
    "id" | "createdAt" | "updatedAt"
  >
): TicketTemplate {
  const templates =
    getTicketTemplates();

  const now =
    new Date().toLocaleString();

  const newTemplate =
    normalizeTemplate({
      ...template,

      id:
        createId(),

      createdAt:
        now,

      updatedAt:
        now,
    });

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

  const updatedTemplates =
    templates.map(
      (template) => {
        if (template.id !== id) {
          return template;
        }

        const nextTemplate =
          normalizeTemplate({
            ...template,
            ...updates,

            id:
              template.id,

            createdAt:
              template.createdAt,

            updatedAt:
              new Date().toLocaleString(),
          });

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

  saveTicketTemplates(
    templates.filter(
      (template) =>
        template.id !== id
    )
  );
}

export function getTicketTemplatesByCompanyId(
  companyId: string
) {
  return getTicketTemplates().filter(
    (template) =>
      template.companyId === companyId
  );
}

export function getTicketTemplatesByDepartmentId(
  departmentId: string
) {
  return getTicketTemplates().filter(
    (template) =>
      template.departmentId === departmentId
  );
}

export function getTicketTemplatePriorityLabel(
  priority: TicketTemplatePriority | string
) {
  if (priority === "low") {
    return "Niedrig";
  }

  if (priority === "medium") {
    return "Mittel";
  }

  if (priority === "high") {
    return "Hoch";
  }

  if (priority === "urgent") {
    return "Dringend";
  }

  return "Unbekannt";
}

export function getTicketTemplateStatusLabel(
  status: TicketTemplateStatus | string
) {
  if (status === "open") {
    return "Offen";
  }

  if (status === "in_progress") {
    return "In Bearbeitung";
  }

  if (status === "waiting") {
    return "Wartend";
  }

  if (status === "done") {
    return "Erledigt";
  }

  if (status === "closed") {
    return "Geschlossen";
  }

  return "Unbekannt";
}

export function getTicketTemplatePriorityClass(
  priority: TicketTemplatePriority | string
) {
  if (priority === "low") {
    return "bg-zinc-100 text-zinc-700";
  }

  if (priority === "medium") {
    return "bg-blue-50 text-blue-700";
  }

  if (priority === "high") {
    return "bg-orange-100 text-orange-700";
  }

  if (priority === "urgent") {
    return "bg-red-50 text-red-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

export function getTicketTemplateStatusClass(
  status: TicketTemplateStatus | string
) {
  if (status === "open") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "in_progress") {
    return "bg-indigo-50 text-indigo-700";
  }

  if (status === "waiting") {
    return "bg-yellow-100 text-yellow-700";
  }

  if (status === "done") {
    return "bg-green-50 text-green-700";
  }

  if (status === "closed") {
    return "bg-zinc-100 text-zinc-700";
  }

  return "bg-zinc-100 text-zinc-700";
}