import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "../../../types/ticket";

import type {
  TicketTemplate,
  TicketTemplatePriority,
  TicketTemplateStatus,
} from "../../../types/ticketTemplate";

export type TicketRow = {
  id: number | string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  company_id: string | null;
  department_id: string | null;
  company: string | null;
  department: string | null;
  assigned_to: string | null;
  created_by: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
};

export type TicketTemplateRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  company_id: string | null;
  department_id: string | null;
  company: string | null;
  department: string | null;
  assigned_to: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
};

export function mapTicketRow(
  row: TicketRow
): Ticket {
  return {
    id:
      String(
        row.id
      ),

    title:
      row.title,

    description:
      row.description ||
      "",

    status:
      row.status as TicketStatus,

    priority:
      row.priority as TicketPriority,

    category:
      row.category ||
      "Allgemein",

    companyId:
      row.company_id ||
      "",

    departmentId:
      row.department_id ||
      "",

    company:
      row.company ||
      "Intern",

    department:
      row.department ||
      "Allgemein",

    assignedTo:
      row.assigned_to ||
      "",

    createdBy:
      row.created_by ||
      "",

    tags:
      Array.isArray(
        row.tags
      )
        ? row.tags
        : [],

    createdAt:
      new Date(
        row.created_at
      ).toLocaleString(),

    updatedAt:
      new Date(
        row.updated_at
      ).toLocaleString(),
  };
}

export function mapTicketTemplateRow(
  row: TicketTemplateRow
): TicketTemplate {
  return {
    id:
      row.id,

    title:
      row.title,

    description:
      row.description ||
      "",

    status:
      row.status as TicketTemplateStatus,

    priority:
      row.priority as TicketTemplatePriority,

    category:
      row.category ||
      "Allgemein",

    companyId:
      row.company_id ||
      "",

    departmentId:
      row.department_id ||
      "",

    company:
      row.company ||
      "Intern",

    department:
      row.department ||
      "Allgemein",

    assignedTo:
      row.assigned_to ||
      "",

    tags:
      Array.isArray(
        row.tags
      )
        ? row.tags
        : [],

    createdAt:
      new Date(
        row.created_at
      ).toLocaleString(),

    updatedAt:
      new Date(
        row.updated_at
      ).toLocaleString(),
  };
}