export type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "../lib/ticketStorage";

export type TicketCreateInput = Omit<
  import("../lib/ticketStorage").Ticket,
  "id" | "createdAt" | "updatedAt"
>;

export type TicketUpdateInput =
  Partial<
    Omit<
      import("../lib/ticketStorage").Ticket,
      "id" | "createdAt" | "updatedAt"
    >
  >;