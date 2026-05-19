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
  createTicketComment,
  deleteTicketComment,
  getTicketCommentById,
  getTicketComments,
  updateTicketComment,
} from "./ticketCommentStorage";

import type {
  TicketComment,
} from "./ticketCommentStorage";

import {
  createTicketTemplate,
  deleteTicketTemplate,
  getTicketTemplateById,
  getTicketTemplates,
  updateTicketTemplate,
} from "./ticketTemplateStorage";

import type {
  TicketTemplate,
} from "./ticketTemplateStorage";

function filterTicketComments(
  comments: TicketComment[],
  query?: DataAdapterQuery
) {
  if (!query) {
    return comments;
  }

  return comments.filter(
    (comment) => {
      const matchesSearch =
        matchesSearchQuery(
          [
            comment.text,
            comment.author,
            comment.authorEmail,
            comment.company,
            comment.department,
            comment.ticketId,
          ],
          query.search
        );

      const matchesCompany =
        !query.companyId ||
        comment.companyId === query.companyId;

      const matchesDepartment =
        !query.departmentId ||
        comment.departmentId === query.departmentId;

      const matchesEntityId =
        !query.entityId ||
        comment.ticketId === query.entityId;

      return (
        matchesSearch &&
        matchesCompany &&
        matchesDepartment &&
        matchesEntityId
      );
    }
  );
}

function filterTicketTemplates(
  templates: TicketTemplate[],
  query?: DataAdapterQuery
) {
  if (!query) {
    return templates;
  }

  return templates.filter(
    (template) => {
      const matchesSearch =
        matchesSearchQuery(
          [
            template.title,
            template.description,
            template.category,
            template.priority,
            template.status,
            template.company,
            template.department,
            template.assignedTo,
            template.tags?.join(" "),
          ],
          query.search
        );

      const matchesCompany =
        !query.companyId ||
        template.companyId === query.companyId;

      const matchesDepartment =
        !query.departmentId ||
        template.departmentId === query.departmentId;

      const matchesStatus =
        !query.status ||
        template.status === query.status;

      return (
        matchesSearch &&
        matchesCompany &&
        matchesDepartment &&
        matchesStatus
      );
    }
  );
}

export const ticketCommentLocalStorageAdapter: DataAdapter<TicketComment> =
  {
    meta:
      createLocalStorageAdapterMeta(
        "ticketComment",
        "dms_ticket_comments"
      ),

    async list(
      query?: DataAdapterQuery
    ) {
      try {
        const comments =
          getTicketComments();

        const filteredComments =
          filterTicketComments(
            comments,
            query
          );

        return createSuccessListResult(
          applyPagination(
            filteredComments,
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
            "Ticket-Kommentare konnten nicht geladen werden.",
        };
      }
    },

    async getById(
      id: string
    ) {
      try {
        return createSuccessResult(
          getTicketCommentById(
            id
          )
        );
      } catch {
        return createErrorResult<TicketComment | null>(
          "Ticket-Kommentar konnte nicht geladen werden."
        );
      }
    },

    async create(
      data
    ) {
      try {
        const comment =
          createTicketComment(
            data
          );

        return createSuccessResult(
          comment
        );
      } catch {
        return createErrorResult<TicketComment>(
          "Ticket-Kommentar konnte nicht erstellt werden."
        );
      }
    },

    async update(
      id: string,
      data: Partial<TicketComment>
    ) {
      try {
        const comment =
          updateTicketComment(
            id,
            data
          );

        return createSuccessResult(
          comment
        );
      } catch {
        return createErrorResult<TicketComment | null>(
          "Ticket-Kommentar konnte nicht aktualisiert werden."
        );
      }
    },

    async delete(
      id: string
    ) {
      try {
        deleteTicketComment(
          id
        );

        return createSuccessResult(
          true
        );
      } catch {
        return createErrorResult<boolean>(
          "Ticket-Kommentar konnte nicht gelöscht werden."
        );
      }
    },
  };

export const ticketTemplateLocalStorageAdapter: DataAdapter<TicketTemplate> =
  {
    meta:
      createLocalStorageAdapterMeta(
        "ticketTemplate",
        "dms_ticket_templates"
      ),

    async list(
      query?: DataAdapterQuery
    ) {
      try {
        const templates =
          getTicketTemplates();

        const filteredTemplates =
          filterTicketTemplates(
            templates,
            query
          );

        return createSuccessListResult(
          applyPagination(
            filteredTemplates,
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
            "Ticket-Vorlagen konnten nicht geladen werden.",
        };
      }
    },

    async getById(
      id: string
    ) {
      try {
        return createSuccessResult(
          getTicketTemplateById(
            id
          )
        );
      } catch {
        return createErrorResult<TicketTemplate | null>(
          "Ticket-Vorlage konnte nicht geladen werden."
        );
      }
    },

    async create(
      data
    ) {
      try {
        const template =
          createTicketTemplate(
            data
          );

        return createSuccessResult(
          template
        );
      } catch {
        return createErrorResult<TicketTemplate>(
          "Ticket-Vorlage konnte nicht erstellt werden."
        );
      }
    },

    async update(
      id: string,
      data: Partial<TicketTemplate>
    ) {
      try {
        const template =
          updateTicketTemplate(
            id,
            data
          );

        return createSuccessResult(
          template
        );
      } catch {
        return createErrorResult<TicketTemplate | null>(
          "Ticket-Vorlage konnte nicht aktualisiert werden."
        );
      }
    },

    async delete(
      id: string
    ) {
      try {
        deleteTicketTemplate(
          id
        );

        return createSuccessResult(
          true
        );
      } catch {
        return createErrorResult<boolean>(
          "Ticket-Vorlage konnte nicht gelöscht werden."
        );
      }
    },
  };

export function getTicketCommentAdapter() {
  return ticketCommentLocalStorageAdapter;
}

export function getTicketTemplateAdapter() {
  return ticketTemplateLocalStorageAdapter;
}