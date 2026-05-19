import {
  saveActivity,
} from "./activityStorage";

import type {
  Ticket,
} from "./ticketStorage";

import type {
  TicketTemplate,
} from "./ticketTemplateStorage";

import {
  getCurrentUser,
} from "./permissions";

type TicketTemplateActivityAction =
  | "created"
  | "updated"
  | "deleted"
  | "ticket_created_from_template";

function getUserContext() {
  const user =
    getCurrentUser();

  return {
    userName:
      user?.name ||
      "Unbekannt",

    userEmail:
      user?.email ||
      "",

    user:
      user?.name ||
      "Unbekannt",

    companyId:
      user?.companyId ||
      "",

    departmentId:
      user?.departmentId ||
      "",

    company:
      user?.company ||
      "Intern",

    department:
      user?.department ||
      "Allgemein",
  };
}

function getActivityType(
  action: TicketTemplateActivityAction
) {
  if (action === "created") {
    return "ticket_created";
  }

  if (action === "updated") {
    return "ticket_updated";
  }

  if (action === "deleted") {
    return "ticket_deleted";
  }

  if (action === "ticket_created_from_template") {
    return "ticket_created";
  }

  return "system";
}

function getActivityTitle(
  action: TicketTemplateActivityAction,
  template: TicketTemplate,
  ticket?: Ticket
) {
  if (action === "created") {
    return `Ticket-Vorlage erstellt: ${template.title}`;
  }

  if (action === "updated") {
    return `Ticket-Vorlage aktualisiert: ${template.title}`;
  }

  if (action === "deleted") {
    return `Ticket-Vorlage gelöscht: ${template.title}`;
  }

  if (action === "ticket_created_from_template") {
    return `Ticket aus Vorlage erstellt: ${ticket?.title || template.title}`;
  }

  return template.title;
}

export function saveTicketTemplateActivity(
  action: TicketTemplateActivityAction,
  template: TicketTemplate,
  ticket?: Ticket,
  description?: string
) {
  const userContext =
    getUserContext();

  saveActivity({
    type:
      getActivityType(
        action
      ),

    title:
      getActivityTitle(
        action,
        template,
        ticket
      ),

    description:
      description ||
      template.description ||
      "",

    entityId:
      ticket?.id ||
      template.id,

    entityType:
      ticket
        ? "ticket"
        : "ticket_template",

    userName:
      userContext.userName,

    userEmail:
      userContext.userEmail,

    user:
      userContext.user,

    companyId:
      template.companyId ||
      ticket?.companyId ||
      userContext.companyId,

    departmentId:
      template.departmentId ||
      ticket?.departmentId ||
      userContext.departmentId,

    company:
      template.company ||
      ticket?.company ||
      userContext.company,

    department:
      template.department ||
      ticket?.department ||
      userContext.department,

    metadata:
      {
        templateId:
          template.id,

        ticketId:
          ticket?.id ||
          "",

        status:
          template.status,

        priority:
          template.priority,

        category:
          template.category,
      },
  });
}

export function saveTicketTemplateCreatedActivity(
  template: TicketTemplate
) {
  saveTicketTemplateActivity(
    "created",
    template,
    undefined,
    "Eine neue Ticket-Vorlage wurde erstellt."
  );
}

export function saveTicketTemplateUpdatedActivity(
  template: TicketTemplate
) {
  saveTicketTemplateActivity(
    "updated",
    template,
    undefined,
    "Eine Ticket-Vorlage wurde aktualisiert."
  );
}

export function saveTicketTemplateDeletedActivity(
  template: TicketTemplate
) {
  saveTicketTemplateActivity(
    "deleted",
    template,
    undefined,
    "Eine Ticket-Vorlage wurde gelöscht."
  );
}

export function saveTicketCreatedFromTemplateActivity(
  template: TicketTemplate,
  ticket: Ticket
) {
  saveTicketTemplateActivity(
    "ticket_created_from_template",
    template,
    ticket,
    "Aus einer Ticket-Vorlage wurde ein neues Ticket erstellt."
  );
}