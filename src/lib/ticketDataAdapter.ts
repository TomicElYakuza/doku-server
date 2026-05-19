import {
  applyPagination,
  createErrorResult,
  createLocalStorageAdapterMeta,
  createSuccessListResult,
  createSuccessResult,
  matchesSearchQuery,
} from "./dataAdapter";

import type {
  DataAdapter,
  DataAdapterQuery,
} from "./dataAdapter";

import {
  createTicket,
  deleteTicket,
  getTicketById,
  getTickets,
  updateTicket,
} from "./ticketStorage";

import type {
  Ticket,
} from "./ticketStorage";

function filterTickets(
  tickets: Ticket[],
  query?: DataAdapterQuery
) {
  if (!query) {
    return tickets;
  }

  return tickets.filter(
    (ticket) => {
      const matchesSearch =
        matchesSearchQuery(
          [
            ticket.title,
            ticket.description,
            ticket.category,
            ticket.company,
            ticket.department,
            ticket.assignedTo,
            ticket.createdBy,
            ticket.tags?.join(" "),
          ],
          query.search
        );

      const matchesCompany =
        !query.companyId ||
        ticket.companyId === query.companyId;

      const matchesDepartment =
        !query.departmentId ||
        ticket.departmentId === query.departmentId;

      const matchesStatus =
        !query.status ||
        ticket.status === query.status;

      return (
        matchesSearch &&
        matchesCompany &&
        matchesDepartment &&
        matchesStatus
      );
    }
  );
}

export const ticketLocalStorageAdapter: DataAdapter<Ticket> =
  {
    meta:
      createLocalStorageAdapterMeta(
        "ticket",
        "dms_tickets"
      ),

    async list(
      query?: DataAdapterQuery
    ) {
      try {
        const tickets =
          getTickets();

        const filteredTickets =
          filterTickets(
            tickets,
            query
          );

        return createSuccessListResult(
          applyPagination(
            filteredTickets,
            query
          )
        );
      } catch {
        return {
          success:
            false,

          data:
            [],

          error:
            "Tickets konnten nicht geladen werden.",
        };
      }
    },

    async getById(
      id: string
    ) {
      try {
        return createSuccessResult(
          getTicketById(
            id
          )
        );
      } catch {
        return createErrorResult<Ticket | null>(
          "Ticket konnte nicht geladen werden."
        );
      }
    },

    async create(
      data
    ) {
      try {
        const ticket =
          createTicket(
            data
          );

        return createSuccessResult(
          ticket
        );
      } catch {
        return createErrorResult<Ticket>(
          "Ticket konnte nicht erstellt werden."
        );
      }
    },

    async update(
      id: string,
      data: Partial<Ticket>
    ) {
      try {
        const ticket =
          updateTicket(
            id,
            data
          );

        return createSuccessResult(
          ticket
        );
      } catch {
        return createErrorResult<Ticket | null>(
          "Ticket konnte nicht aktualisiert werden."
        );
      }
    },

    async delete(
      id: string
    ) {
      try {
        deleteTicket(
          id
        );

        return createSuccessResult(
          true
        );
      } catch {
        return createErrorResult<boolean>(
          "Ticket konnte nicht gelöscht werden."
        );
      }
    },
  };

export function getTicketAdapter() {
  return ticketLocalStorageAdapter;
}