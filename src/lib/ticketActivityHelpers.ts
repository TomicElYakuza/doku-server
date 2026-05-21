import {
  saveActivity,
} from "./activityStorage";

import type {
  Ticket,
} from "../types/ticket";

import {
  getCurrentUser,
} from "./permissions";

type TicketActivityAction =
  | "created"
  | "updated"
  | "deleted";

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
  action: TicketActivityAction
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

  return "system";
}

function getActivityTitle(
  action: TicketActivityAction,
  ticket: Ticket
) {
  if (action === "created") {
    return `Ticket erstellt: ${ticket.title}`;
  }

  if (action === "updated") {
    return `Ticket aktualisiert: ${ticket.title}`;
  }

  if (action === "deleted") {
    return `Ticket gelöscht: ${ticket.title}`;
  }

  return ticket.title;
}

export function saveTicketActivity(
  action: TicketActivityAction,
  ticket: Ticket,
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
        ticket
      ),

    description:
      description ||
      ticket.description ||
      "",

    entityId:
      ticket.id,

    entityType:
      "ticket",

    userName:
      userContext.userName,

    userEmail:
      userContext.userEmail,

    user:
      userContext.user,

    companyId:
      ticket.companyId ||
      userContext.companyId,

    departmentId:
      ticket.departmentId ||
      userContext.departmentId,

    company:
      ticket.company ||
      userContext.company,

    department:
      ticket.department ||
      userContext.department,

    metadata:
      {
        ticketId:
          ticket.id,

        status:
          ticket.status,

        priority:
          ticket.priority,

        category:
          ticket.category,
      },
  });
}

export function saveTicketCreatedActivity(
  ticket: Ticket
) {
  saveTicketActivity(
    "created",
    ticket,
    "Ein neues Ticket wurde erstellt."
  );
}

export function saveTicketUpdatedActivity(
  ticket: Ticket
) {
  saveTicketActivity(
    "updated",
    ticket,
    "Ein Ticket wurde aktualisiert."
  );
}

export function saveTicketDeletedActivity(
  ticket: Ticket
) {
  saveTicketActivity(
    "deleted",
    ticket,
    "Ein Ticket wurde gelöscht."
  );
}