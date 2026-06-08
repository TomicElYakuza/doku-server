export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting"
  | "done"
  | "closed";

export type TicketPriority =
  | "low"
  | "medium"
  | "high"
  | "urgent";

export type Ticket = {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  companyId: string;
  departmentId: string;
  company: string;
  department: string;
  assignedTo: string;
  createdBy: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type TicketCreateInput = Omit<
  Ticket,
  "id" | "createdAt" | "updatedAt"
>;

export type TicketUpdateInput =
  Partial<
    Omit<
      Ticket,
      "id" | "createdAt" | "updatedAt"
    >
  >;
