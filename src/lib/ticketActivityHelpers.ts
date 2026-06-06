import {
  activityRepository,
} from "./activityRepository";

import type {
  Ticket,
} from "../types/ticket";

type TicketActivityType =
  | "created"
  | "edited"
  | "deleted"
  | "restored"
  | "closed"
  | "reopened"
  | string;

function createTicketActivity(
  ticket: Ticket,
  type: TicketActivityType,
  title: string,
  description: string
) {
  void activityRepository
    .create({
      type,

      title,

      description,

      entityType:
        "ticket",

      entityId:
        ticket.id,

      userName:
        ticket.createdBy ||
        "System",

      userEmail:
        "",

      user:
        ticket.createdBy ||
        "System",

      companyId:
        ticket.companyId ||
        "",

      departmentId:
        ticket.departmentId ||
        "",

      company:
        ticket.company ||
        "Intern",

      department:
        ticket.department ||
        "",

      metadata: {
        ticketId:
          ticket.id,

        ticketTitle:
          ticket.title,

        status:
          ticket.status,

        priority:
          ticket.priority,

        category:
          ticket.category,
      },
    })
    .catch(
      (error) => {
        console.error(
          "Ticket-AktivitÃ¤t konnte nicht gespeichert werden:",
          error
        );
      }
    );
}

export function saveTicketCreatedActivity(
  ticket: Ticket
) {
  createTicketActivity(
    ticket,
    "created",
    "Ticket erstellt",
    `Ticket #${ticket.id} "${ticket.title}" wurde erstellt.`
  );
}

export function saveTicketUpdatedActivity(
  ticket: Ticket
) {
  createTicketActivity(
    ticket,
    "edited",
    "Ticket bearbeitet",
    `Ticket #${ticket.id} "${ticket.title}" wurde bearbeitet.`
  );
}

export function saveTicketDeletedActivity(
  ticket: Ticket
) {
  createTicketActivity(
    ticket,
    "deleted",
    "Ticket gelÃ¶scht",
    `Ticket #${ticket.id} "${ticket.title}" wurde gelÃ¶scht.`
  );
}

export function saveTicketClosedActivity(
  ticket: Ticket
) {
  createTicketActivity(
    ticket,
    "closed",
    "Ticket geschlossen",
    `Ticket #${ticket.id} "${ticket.title}" wurde geschlossen.`
  );
}

export function saveTicketReopenedActivity(
  ticket: Ticket
) {
  createTicketActivity(
    ticket,
    "reopened",
    "Ticket wieder geÃ¶ffnet",
    `Ticket #${ticket.id} "${ticket.title}" wurde wieder geÃ¶ffnet.`
  );
}

export function saveTicketStatusChangedActivity(
  ticket: Ticket,
  oldStatus: string,
  newStatus: string
) {
  createTicketActivity(
    ticket,
    "edited",
    "Ticket-Status geÃ¤ndert",
    `Ticket #${ticket.id} wurde von "${oldStatus}" auf "${newStatus}" geÃ¤ndert.`
  );
}

export function saveTicketPriorityChangedActivity(
  ticket: Ticket,
  oldPriority: string,
  newPriority: string
) {
  createTicketActivity(
    ticket,
    "edited",
    "Ticket-PrioritÃ¤t geÃ¤ndert",
    `Ticket #${ticket.id} wurde von "${oldPriority}" auf "${newPriority}" geÃ¤ndert.`
  );
}

export function saveTicketAssignedActivity(
  ticket: Ticket,
  assignedTo: string
) {
  createTicketActivity(
    ticket,
    "edited",
    "Ticket zugewiesen",
    `Ticket #${ticket.id} wurde "${assignedTo}" zugewiesen.`
  );
}

