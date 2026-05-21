export type {
  TicketTemplate,
  TicketTemplatePriority,
  TicketTemplateStatus,
} from "../lib/ticketTemplateStorage";

export type TicketTemplateCreateInput = Omit<
  import("../lib/ticketTemplateStorage").TicketTemplate,
  "id" | "createdAt" | "updatedAt"
>;

export type TicketTemplateUpdateInput =
  Partial<
    Omit<
      import("../lib/ticketTemplateStorage").TicketTemplate,
      "id" | "createdAt" | "updatedAt"
    >
  >;