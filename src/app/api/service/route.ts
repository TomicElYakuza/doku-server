import { NextResponse } from "next/server";

import { query, queryOne } from "../../../lib/database/db";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";
import type {
  ServiceCase,
  ServiceCaseInput,
  ServiceCasePriority,
  ServiceCaseStatus,
  ServiceCaseType,
  ServicePaymentStatus,
} from "../../../types/service";

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

function normalizeMoney(value: unknown) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return 0;
  }

  return Math.round(numberValue * 100) / 100;
}

function normalizeDate(value?: string | null) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  return normalized;
}

function createCaseNumber() {
  return `SC-${Date.now()}`;
}

function createCustomerNumber() {
  return `K-${Date.now()}`;
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

let serviceSchemaReadyPromise: Promise<void> | null = null;

async function ensureServiceSchemaReady() {
  if (!serviceSchemaReadyPromise) {
    serviceSchemaReadyPromise = ensureServiceTables().catch((error) => {
      serviceSchemaReadyPromise = null;
      throw error;
    });
  }

  return serviceSchemaReadyPromise;
}

async function ensureServiceTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS service_customers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_number TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      company_name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS service_cases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      case_number TEXT NOT NULL UNIQUE,
      customer_id UUID,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_phone TEXT,
      type TEXT NOT NULL DEFAULT 'repair',
      status TEXT NOT NULL DEFAULT 'new',
      priority TEXT NOT NULL DEFAULT 'normal',
      title TEXT NOT NULL,
      description TEXT,
      device_name TEXT,
      device_serial_number TEXT,
      device_accessories TEXT,
      intake_notes TEXT,
      internal_notes TEXT,
      customer_notes TEXT,
      assigned_user_id UUID,
      assigned_user_name TEXT,
      company_id UUID,
      department_id UUID,
      inventory_asset_id UUID,
      ticket_id TEXT,
      quote_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      material_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
      labor_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
      total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      payment_status TEXT NOT NULL DEFAULT 'open',
      payment_method TEXT,
      receipt_number TEXT,
      intake_date DATE,
      due_date DATE,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
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

export async function GET(request: Request) {
  try {
    await requireAnyServerPermission([
      "service.view",
      "service.create",
      "service.edit",
      "service.assign",
      "service.dashboard.view",
      "service.payments.manage",
      "service.customers.manage",
      "admin.view",
    ]);

    await ensureServiceSchemaReady();

    const url = new URL(request.url);
    const search = normalizeText(url.searchParams.get("search"));
    const type = normalizeText(url.searchParams.get("type"));
    const status = normalizeText(url.searchParams.get("status"));
    const priority = normalizeText(url.searchParams.get("priority"));
    const paymentStatus = normalizeText(url.searchParams.get("paymentStatus"));
    const assignedUserId = normalizeText(url.searchParams.get("assignedUserId"));
    const companyId = normalizeText(url.searchParams.get("companyId"));
    const departmentId = normalizeText(url.searchParams.get("departmentId"));

    const params: unknown[] = [];
    const whereParts: string[] = [];

    if (search) {
      params.push(`%${search}%`);
      whereParts.push(`
        (
          case_number ILIKE $${params.length}
          OR customer_name ILIKE $${params.length}
          OR customer_email ILIKE $${params.length}
          OR customer_phone ILIKE $${params.length}
          OR title ILIKE $${params.length}
          OR description ILIKE $${params.length}
          OR device_name ILIKE $${params.length}
          OR device_serial_number ILIKE $${params.length}
          OR assigned_user_name ILIKE $${params.length}
          OR receipt_number ILIKE $${params.length}
        )
      `);
    }

    if (type) {
      params.push(normalizeType(type));
      whereParts.push(`type = $${params.length}`);
    }

    if (status) {
      params.push(normalizeStatus(status));
      whereParts.push(`status = $${params.length}`);
    }

    if (priority) {
      params.push(normalizePriority(priority));
      whereParts.push(`priority = $${params.length}`);
    }

    if (paymentStatus) {
      params.push(normalizePaymentStatus(paymentStatus));
      whereParts.push(`payment_status = $${params.length}`);
    }

    if (assignedUserId) {
      params.push(assignedUserId);
      whereParts.push(`assigned_user_id = $${params.length}`);
    }

    if (companyId) {
      params.push(companyId);
      whereParts.push(`company_id = $${params.length}`);
    }

    if (departmentId) {
      params.push(departmentId);
      whereParts.push(`department_id = $${params.length}`);
    }

    const whereSql =
      whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    const rows = await query<ServiceCaseRow>(
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
        ${whereSql}
        ORDER BY updated_at DESC, created_at DESC
      `,
      params,
    );

    return NextResponse.json(rows.map(mapServiceCaseRow));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(error, "Servicefälle konnten nicht geladen werden."),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAnyServerPermission(["service.create", "admin.view"]);

    await ensureServiceSchemaReady();

    const body = (await request.json()) as ServiceCaseInput;

    const customerName = normalizeText(body.customerName);
    const title = normalizeText(body.title);

    if (!customerName) {
      return NextResponse.json(
        {
          message: "Kundenname ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          message: "Titel ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    let customerId = normalizeText(body.customerId);

    if (!customerId) {
      const customerRow = await queryOne<{ id: string }>(
        `
          INSERT INTO service_customers (
            customer_number,
            name,
            company_name,
            email,
            phone,
            address,
            notes
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
          )
          RETURNING id
        `,
        [
          createCustomerNumber(),
          customerName,
          normalizeNullableText(body.customerCompanyName),
          normalizeNullableText(body.customerEmail),
          normalizeNullableText(body.customerPhone),
          normalizeNullableText(body.customerAddress),
          normalizeNullableText(body.customerNotes),
        ],
      );

      customerId = customerRow?.id || "";
    }

    const quoteAmount = normalizeMoney(body.quoteAmount);
    const materialCost = normalizeMoney(body.materialCost);
    const laborCost = normalizeMoney(body.laborCost);
    const explicitTotal = normalizeMoney(body.totalAmount);
    const totalAmount =
      explicitTotal > 0 ? explicitTotal : quoteAmount + materialCost + laborCost;

    const row = await queryOne<ServiceCaseRow>(
      `
        INSERT INTO service_cases (
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
          intake_date,
          due_date,
          completed_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,
          $18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33
        )
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
        createCaseNumber(),
        customerId || null,
        customerName,
        normalizeNullableText(body.customerEmail),
        normalizeNullableText(body.customerPhone),
        normalizeType(body.type),
        normalizeStatus(body.status),
        normalizePriority(body.priority),
        title,
        normalizeNullableText(body.description),
        normalizeNullableText(body.deviceName),
        normalizeNullableText(body.deviceSerialNumber),
        normalizeNullableText(body.deviceAccessories),
        normalizeNullableText(body.intakeNotes),
        normalizeNullableText(body.internalNotes),
        normalizeNullableText(body.customerNotes),
        normalizeNullableText(body.assignedUserId),
        normalizeNullableText(body.assignedUserName),
        normalizeNullableText(body.companyId),
        normalizeNullableText(body.departmentId),
        normalizeNullableText(body.inventoryAssetId),
        normalizeNullableText(body.ticketId),
        quoteAmount,
        materialCost,
        laborCost,
        totalAmount,
        normalizeMoney(body.paidAmount),
        normalizePaymentStatus(body.paymentStatus),
        normalizeNullableText(body.paymentMethod),
        normalizeNullableText(body.receiptNumber),
        normalizeDate(body.intakeDate),
        normalizeDate(body.dueDate),
        normalizeDate(body.completedAt),
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Servicefall konnte nicht erstellt werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(mapServiceCaseRow(row), {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(error, "Servicefall konnte nicht erstellt werden."),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}