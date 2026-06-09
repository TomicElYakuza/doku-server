export type ServiceCaseType =
  | "repair"
  | "sale"
  | "consulting"
  | "warranty"
  | "complaint"
  | "maintenance"
  | "other";

export type ServiceCaseStatus =
  | "new"
  | "checking"
  | "offer"
  | "in_progress"
  | "waiting_customer"
  | "ready_for_pickup"
  | "completed"
  | "cancelled";

export type ServiceCasePriority = "low" | "normal" | "high" | "urgent";

export type ServicePaymentStatus =
  | "open"
  | "partial"
  | "paid"
  | "refunded"
  | "cancelled";

export type ServiceCustomer = {
  id: string;
  customerNumber: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ServiceCase = {
  id: string;
  caseNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  type: ServiceCaseType;
  status: ServiceCaseStatus;
  priority: ServiceCasePriority;
  title: string;
  description: string;
  deviceName: string;
  deviceSerialNumber: string;
  deviceAccessories: string;
  intakeNotes: string;
  internalNotes: string;
  customerNotes: string;
  assignedUserId: string;
  assignedUserName: string;
  companyId: string;
  departmentId: string;
  inventoryAssetId: string;
  ticketId: string;
  quoteAmount: number;
  materialCost: number;
  laborCost: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: ServicePaymentStatus;
  paymentMethod: string;
  receiptNumber: string;
  intakeDate: string;
  dueDate: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ServiceCaseInput = {
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompanyName?: string;
  customerAddress?: string;
  customerNotes?: string;
  type?: ServiceCaseType | string;
  status?: ServiceCaseStatus | string;
  priority?: ServiceCasePriority | string;
  title?: string;
  description?: string;
  deviceName?: string;
  deviceSerialNumber?: string;
  deviceAccessories?: string;
  intakeNotes?: string;
  internalNotes?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  companyId?: string;
  departmentId?: string;
  inventoryAssetId?: string;
  ticketId?: string;
  quoteAmount?: number;
  materialCost?: number;
  laborCost?: number;
  totalAmount?: number;
  paidAmount?: number;
  paymentStatus?: ServicePaymentStatus | string;
  paymentMethod?: string;
  receiptNumber?: string;
  intakeDate?: string;
  dueDate?: string;
  completedAt?: string;
};