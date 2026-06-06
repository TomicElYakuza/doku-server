import {
  activityRepository,
} from "./activityRepository";

import type {
  Ticket,
} from "../types/ticket";

import type {
  TicketTemplate,
} from "../types/ticketTemplate";

function createTemplateActivity(
  template: TicketTemplate,
  type: string,
  title: string,
  description: string
) {
  void activityRepository
    .create({
      type,

      title,

      description,

      entityType:
        "ticketTemplate",

      entityId:
        template.id,

      userName:
        "System",

      userEmail:
        "",

      user:
        "System",

      companyId:
        template.companyId ||
        "",

      departmentId:
        template.departmentId ||
        "",

      company:
        template.company ||
        "Intern",

      department:
        template.department ||
        "",

      metadata: {
        templateId:
          template.id,

        templateTitle:
          template.title,

        status:
          template.status,

        priority:
          template.priority,

        category:
          template.category,
      },
    })
    .catch(
      (error) => {
        console.error(
          "Ticket-Vorlagen-AktivitÃ¤t konnte nicht gespeichert werden:",
          error
        );
      }
    );
}

function createTemplateUsageActivity(
  template: TicketTemplate,
  ticket: Ticket
) {
  void activityRepository
    .create({
      type:
        "created",

      title:
        "Ticket aus Vorlage erstellt",

      description:
        `Aus Vorlage "${template.title}" wurde Ticket #${ticket.id} "${ticket.title}" erstellt.`,

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
        template.companyId ||
        "",

      departmentId:
        ticket.departmentId ||
        template.departmentId ||
        "",

      company:
        ticket.company ||
        template.company ||
        "Intern",

      department:
        ticket.department ||
        template.department ||
        "",

      metadata: {
        ticketId:
          ticket.id,

        ticketTitle:
          ticket.title,

        templateId:
          template.id,

        templateTitle:
          template.title,
      },
    })
    .catch(
      (error) => {
        console.error(
          "Vorlagen-Nutzung konnte nicht protokolliert werden:",
          error
        );
      }
    );
}

export function saveTicketTemplateCreatedActivity(
  template: TicketTemplate
) {
  createTemplateActivity(
    template,
    "created",
    "Ticket-Vorlage erstellt",
    `Ticket-Vorlage "${template.title}" wurde erstellt.`
  );
}

export function saveTicketTemplateUpdatedActivity(
  template: TicketTemplate
) {
  createTemplateActivity(
    template,
    "edited",
    "Ticket-Vorlage bearbeitet",
    `Ticket-Vorlage "${template.title}" wurde bearbeitet.`
  );
}

export function saveTicketTemplateDeletedActivity(
  template: TicketTemplate
) {
  createTemplateActivity(
    template,
    "deleted",
    "Ticket-Vorlage gelÃ¶scht",
    `Ticket-Vorlage "${template.title}" wurde gelÃ¶scht.`
  );
}

export function saveTicketCreatedFromTemplateActivity(
  template: TicketTemplate,
  ticket: Ticket
) {
  createTemplateUsageActivity(
    template,
    ticket
  );
}

export function saveTicketTemplateUsedActivity(
  template: TicketTemplate,
  ticket: Ticket
) {
  createTemplateUsageActivity(
    template,
    ticket
  );
}

