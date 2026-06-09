import { NextResponse } from "next/server";

import { queryOne } from "../../../../lib/database/db";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";
import type {
  ServiceCase,
  ServiceCaseInput,
  ServiceCasePriority,
  ServiceCaseStatus,
  ServiceCaseType,
  ServicePaymentStatus,
} from "../../../../types/service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ServiceCaseRow = {
  id: string;
  case_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  type: string;
  status: string;
  priority: string;
  title: string;
  description: string | null;
  device_name: string | null;
  device_serial_number: string | null;
  device_accessories: string | null;
  intake_notes: string | null;
  internal_notes: string | null;
  customer_notes: string | null;
  assigned_user_id: string | null;
  assigned_user_name: string | null;
  company_id: string | null;
  department_id: string | null;
  inventory_asset_id: string | null;
  ticket_id: string | null;
  quote_amount: string | number | null;
  material_cost: string | number | null;
  labor_cost: string | number | null;
  total_amount: string | number | null;
  paid_amount: string | number | null;
  payment_status: string;
  payment_method: string | null;
  receipt_number: string | null;
  intake_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

const serviceTypes = new Set([
  "repair",
  "sale",
  "consulting",
  "warranty",
  "complaint",
  "maintenance",
  "other",
]);

const serviceStatuses = new Set([
  "new",
  "checking",
  "offer",
  "in_progress",
  "waiting_customer",
  "ready_for_pickup",
  "completed",
  "cancelled",
]);

const servicePriorities = new Set(["low", "normal", "high", "urgent"]);

const paymentStatuses = new Set([
  "open",
  "partial",
  "paid",
  "refunded",
  "cancelled",
]);

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeNullableText(value?: string | null) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeType(value?: string | null): ServiceCaseType {
  if (serviceTypes.has(String(value || ""))) {
    return value as ServiceCaseType;
  }

  return "repair";
}

function normalizeStatus(value?: string | null): ServiceCaseStatus {
  if (serviceStatuses.has(String(value || ""))) {
    return value as ServiceCaseStatus;
  }

  return "new";
}

function normalizePriority(value?: string | null): ServiceCasePriority {
  if (servicePriorities.has(String(value || ""))) {
    return value as ServiceCasePriority;
  }

  return "normal";
}

function normalizePaymentStatus(value?: string | null): ServicePaymentStatus {
  if (paymentStatuses.has(String(value || ""))) {
    return value as ServicePaymentStatus;
  }

  return "open";
}

function normalizeMoney(value: unknown, fallback: unknown = 0) {
  const numberValue = Number(value);

  if (Number.isFinite(numberValue) && numberValue >= 0) {
    return Math.round(numberValue * 100) / 100;
  }

  const fallbackValue = Number(fallback);

  if (Number.isFinite(fallbackValue) && fallbackValue >= 0) {
    return Math.round(fallbackValue * 100) / 100;
  }

  return 0;
}

function normalizeDate(value?: string | null) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  return normalized;
}

function mapServiceCaseRow(row: ServiceCaseRow): ServiceCase {
  return {
    id: row.id,
    caseNumber: row.case_number,
    customerId: row.customer_id || "",
    customerName: row.customer_name || "",
    customerEmail: row.customer_email || "",
    customerPhone: row.customer_phone || "",
    type: normalizeType(row.type),
    status: normalizeStatus(row.status),
    priority: normalizePriority(row.priority),
    title: row.title || "",
    description: row.description || "",
    deviceName: row.device_name || "",
    deviceSerialNumber: row.device_serial_number || "",
    deviceAccessories: row.device_accessories || "",
    intakeNotes: row.intake_notes || "",
    internalNotes: row.internal_notes || "",
    customerNotes: row.customer_notes || "",
    assignedUserId: row.assigned_user_id || "",
    assignedUserName: row.assigned_user_name || "",
    companyId: row.company_id || "",
    departmentId: row.department_id || "",
    inventoryAssetId: row.inventory_asset_id || "",
    ticketId: row.ticket_id || "",
    quoteAmount: Number(row.quote_amount || 0),
    materialCost: Number(row.material_cost || 0),
    laborCost: Number(row.labor_cost || 0),
    totalAmount: Number(row.total_amount || 0),
    paidAmount: Number(row.paid_amount || 0),
    paymentStatus: normalizePaymentStatus(row.payment_status),
    paymentMethod: row.payment_method || "",
    receiptNumber: row.receipt_number || "",
    intakeDate: row.intake_date || "",
    dueDate: row.due_date || "",
    completedAt: row.completed_at || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findServiceCase(id: string) {
  return queryOne<ServiceCaseRow>(
    `
      SELECT
        id,
        case_number,
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        type,
        status,
        priority,
        title,
        description,
        device_name,
        device_serial_number,
        device_accessories,
        intake_notes,
        internal_notes,
        customer_notes,
        assigned_user_id,
        assigned_user_name,
        company_id,
        department_id,
        inventory_asset_id,
        ticket_id,
        quote_amount,
        material_cost,
        labor_cost,
        total_amount,
        paid_amount,
        payment_status,
        payment_method,
        receipt_number,
        intake_date::text,
        due_date::text,
        completed_at::text,
        created_at::text,
        updated_at::text
      FROM service_cases
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );
}

function getErrorStatus(error: unknown) {
  if (isPermissionError(error)) {
    return 403;
  }

  return 500;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (isPermissionError(error)) {
    return "Keine Berechtigung.";
  }

  return error instanceof Error ? error.message : fallback;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAnyServerPermission([
      "service.view",
      "service.edit",
      "service.assign",
      "service.dashboard.view",
      "admin.view",
    ]);

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);

    const row = await findServiceCase(decodedId);

    if (!row) {
      return NextResponse.json(
        {
          message: "Servicefall wurde nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(mapServiceCaseRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(error, "Servicefall konnte nicht geladen werden."),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAnyServerPermission([
      "service.edit",
      "service.assign",
      "service.payments.manage",
      "admin.view",
    ]);

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);
    const body = (await request.json()) as ServiceCaseInput;

    const currentRow = await findServiceCase(decodedId);

    if (!currentRow) {
      return NextResponse.json(
        {
          message: "Servicefall wurde nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    const nextCustomerName =
      body.customerName !== undefined
        ? normalizeText(body.customerName)
        : currentRow.customer_name;

    const nextTitle =
      body.title !== undefined ? normalizeText(body.title) : currentRow.title;

    if (!nextCustomerName) {
      return NextResponse.json(
        {
          message: "Kundenname ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!nextTitle) {
      return NextResponse.json(
        {
          message: "Titel ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const quoteAmount =
      body.quoteAmount !== undefined
        ? normalizeMoney(body.quoteAmount, currentRow.quote_amount)
        : normalizeMoney(currentRow.quote_amount);

    const materialCost =
      body.materialCost !== undefined
        ? normalizeMoney(body.materialCost, currentRow.material_cost)
        : normalizeMoney(currentRow.material_cost);

    const laborCost =
      body.laborCost !== undefined
        ? normalizeMoney(body.laborCost, currentRow.labor_cost)
        : normalizeMoney(currentRow.labor_cost);

    const totalAmount =
      body.totalAmount !== undefined
        ? normalizeMoney(body.totalAmount, currentRow.total_amount)
        : normalizeMoney(currentRow.total_amount);

    const paidAmount =
      body.paidAmount !== undefined
        ? normalizeMoney(body.paidAmount, currentRow.paid_amount)
        : normalizeMoney(currentRow.paid_amount);

    const row = await queryOne<ServiceCaseRow>(
      `
        UPDATE service_cases
        SET
          customer_name = $1,
          customer_email = $2,
          customer_phone = $3,
          type = $4,
          status = $5,
          priority = $6,
          title = $7,
          description = $8,
          device_name = $9,
          device_serial_number = $10,
          device_accessories = $11,
          intake_notes = $12,
          internal_notes = $13,
          customer_notes = $14,
          assigned_user_id = $15,
          assigned_user_name = $16,
          company_id = $17,
          department_id = $18,
          inventory_asset_id = $19,
          ticket_id = $20,
          quote_amount = $21,
          material_cost = $22,
          labor_cost = $23,
          total_amount = $24,
          paid_amount = $25,
          payment_status = $26,
          payment_method = $27,
          receipt_number = $28,
          intake_date = $29,
          due_date = $30,
          completed_at = $31,
          updated_at = NOW()
        WHERE id = $32
        RETURNING
          id,
          case_number,
          customer_id,
          customer_name,
          customer_email,
          customer_phone,
          type,
          status,
          priority,
          title,
          description,
          device_name,
          device_serial_number,
          device_accessories,
          intake_notes,
          internal_notes,
          customer_notes,
          assigned_user_id,
          assigned_user_name,
          company_id,
          department_id,
          inventory_asset_id,
          ticket_id,
          quote_amount,
          material_cost,
          labor_cost,
          total_amount,
          paid_amount,
          payment_status,
          payment_method,
          receipt_number,
          intake_date::text,
          due_date::text,
          completed_at::text,
          created_at::text,
          updated_at::text
      `,
      [
        nextCustomerName,
        body.customerEmail !== undefined
          ? normalizeNullableText(body.customerEmail)
          : currentRow.customer_email,
        body.customerPhone !== undefined
          ? normalizeNullableText(body.customerPhone)
          : currentRow.customer_phone,
        body.type !== undefined ? normalizeType(body.type) : normalizeType(currentRow.type),
        body.status !== undefined
          ? normalizeStatus(body.status)
          : normalizeStatus(currentRow.status),
        body.priority !== undefined
          ? normalizePriority(body.priority)
          : normalizePriority(currentRow.priority),
        nextTitle,
        body.description !== undefined
          ? normalizeNullableText(body.description)
          : currentRow.description,
        body.deviceName !== undefined
          ? normalizeNullableText(body.deviceName)
          : currentRow.device_name,
        body.deviceSerialNumber !== undefined
          ? normalizeNullableText(body.deviceSerialNumber)
          : currentRow.device_serial_number,
        body.deviceAccessories !== undefined
          ? normalizeNullableText(body.deviceAccessories)
          : currentRow.device_accessories,
        body.intakeNotes !== undefined
          ? normalizeNullableText(body.intakeNotes)
          : currentRow.intake_notes,
        body.internalNotes !== undefined
          ? normalizeNullableText(body.internalNotes)
          : currentRow.internal_notes,
        body.customerNotes !== undefined
          ? normalizeNullableText(body.customerNotes)
          : currentRow.customer_notes,
        body.assignedUserId !== undefined
          ? normalizeNullableText(body.assignedUserId)
          : currentRow.assigned_user_id,
        body.assignedUserName !== undefined
          ? normalizeNullableText(body.assignedUserName)
          : currentRow.assigned_user_name,
        body.companyId !== undefined
          ? normalizeNullableText(body.companyId)
          : currentRow.company_id,
        body.departmentId !== undefined
          ? normalizeNullableText(body.departmentId)
          : currentRow.department_id,
        body.inventoryAssetId !== undefined
          ? normalizeNullableText(body.inventoryAssetId)
          : currentRow.inventory_asset_id,
        body.ticketId !== undefined
          ? normalizeNullableText(body.ticketId)
          : currentRow.ticket_id,
        quoteAmount,
        materialCost,
        laborCost,
        totalAmount,
        paidAmount,
        body.paymentStatus !== undefined
          ? normalizePaymentStatus(body.paymentStatus)
          : normalizePaymentStatus(currentRow.payment_status),
        body.paymentMethod !== undefined
          ? normalizeNullableText(body.paymentMethod)
          : currentRow.payment_method,
        body.receiptNumber !== undefined
          ? normalizeNullableText(body.receiptNumber)
          : currentRow.receipt_number,
        body.intakeDate !== undefined
          ? normalizeDate(body.intakeDate)
          : normalizeDate(currentRow.intake_date),
        body.dueDate !== undefined
          ? normalizeDate(body.dueDate)
          : normalizeDate(currentRow.due_date),
        body.completedAt !== undefined
          ? normalizeDate(body.completedAt)
          : normalizeDate(currentRow.completed_at),
        decodedId,
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Servicefall konnte nicht gespeichert werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(mapServiceCaseRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(error, "Servicefall konnte nicht gespeichert werden."),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAnyServerPermission(["service.delete", "admin.view"]);

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);

    const deleted = await queryOne<{ id: string }>(
      `
        DELETE FROM service_cases
        WHERE id = $1
        RETURNING id
      `,
      [decodedId],
    );

    if (!deleted) {
      return NextResponse.json(
        {
          message: "Servicefall wurde nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(error, "Servicefall konnte nicht gelöscht werden."),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}