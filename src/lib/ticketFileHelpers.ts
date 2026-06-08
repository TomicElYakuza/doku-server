import {
  activityRepository,
} from "./activityRepository";

import {
  fileRepository,
} from "./fileRepository";

import type {
  StoredFile,
} from "../types/file";

import type {
  Ticket,
} from "../types/ticket";

function getTicketFileKey(
  ticketId: string
) {
  return `ticket-${ticketId}`;
}

function createTicketFileActivity(
  ticket: Ticket,
  type: string,
  title: string,
  description: string,
  fileName = ""
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

        fileName,
      },
    })
    .catch(
      (error) => {
        console.error(
          "Ticket-Datei-Aktivität konnte nicht gespeichert werden:",
          error
        );
      }
    );
}

export async function getTicketFiles(
  ticketId: string
) {
  return fileRepository.listForKey(
    getTicketFileKey(
      ticketId
    )
  );
}

export async function saveTicketFile(
  ticket: Ticket,
  file: Partial<StoredFile>
) {
  await fileRepository.addToKey(
    getTicketFileKey(
      ticket.id
    ),
    file
  );

  createTicketFileActivity(
    ticket,
    "created",
    "Ticket-Datei hochgeladen",
    `Datei "${file.name || "Unbenannte Datei"}" wurde zu Ticket #${ticket.id} hochgeladen.`,
    file.name ||
      ""
  );
}

export async function deleteTicketFile(
  ticket: Ticket,
  index: number,
  fileName = ""
) {
  await fileRepository.deleteFromKey(
    getTicketFileKey(
      ticket.id
    ),
    index
  );

  createTicketFileActivity(
    ticket,
    "deleted",
    "Ticket-Datei gelöscht",
    `Datei "${fileName || "Unbenannte Datei"}" wurde von Ticket #${ticket.id} gelöscht.`,
    fileName
  );
}

export async function deleteTicketFiles(
  ticketId: string
) {
  await fileRepository.deleteKey(
    getTicketFileKey(
      ticketId
    )
  );
}


