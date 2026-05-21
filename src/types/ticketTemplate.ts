export type TicketTemplateStatus =
  | "open"
  | "in_progress"
  | "waiting"
  | "done"
  | "closed";

export type TicketTemplatePriority =
  | "low"
  | "medium"
  | "high"
  | "urgent";

export type TicketTemplate = {
  id: string;
  title: string;
  description: string;
  status: TicketTemplateStatus;
  priority: TicketTemplatePriority;
  category: string;
  companyId: string;
  departmentId: string;
  company: string;
  department: string;
  assignedTo: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type TicketTemplateCreateInput = Omit<
  TicketTemplate,
  "id" | "createdAt" | "updatedAt"
>;

export type TicketTemplateUpdateInput =
  Partial<
    Omit<
      TicketTemplate,
      "id" | "createdAt" | "updatedAt"
    >
  >;