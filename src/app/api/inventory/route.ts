import { NextResponse } from "next/server";

import { query, queryOne } from "../../../lib/database/db";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";
import type {
  InventoryAsset,
  InventoryAssetInput,
  InventoryAssetStatus,
  InventoryAssetType,
} from "../../../types/inventory";

type InventoryAssetRow = {
  id: string;
  asset_number: string;
  name: string;
  type: string;
  status: string;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  hostname: string | null;
  ip_address: string | null;
  location: string | null;
  assigned_user_id: string | null;
  assigned_user_name: string | null;
  company_id: string | null;
  department_id: string | null;
  operating_system: string | null;
  cpu: string | null;
  gpu: string | null;
  ram_gb: number | null;
  storage_gb: number | null;
  hardware_notes: string | null;
  software_notes: string | null;
  purchase_date: string | null;
  warranty_until: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

const assetTypes = new Set([
  "desktop",
  "notebook",
  "server",
  "virtual_machine",
  "printer",
  "network",
  "mobile",
  "peripheral",
  "other",
]);

const assetStatuses = new Set([
  "active",
  "in_stock",
  "in_repair",
  "retired",
  "lost",
  "archived",
]);

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeNullableText(value?: string | null) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeType(value?: string | null): InventoryAssetType {
  if (assetTypes.has(String(value || ""))) {
    return value as InventoryAssetType;
  }

  return "desktop";
}

function normalizeStatus(value?: string | null): InventoryAssetStatus {
  if (assetStatuses.has(String(value || ""))) {
    return value as InventoryAssetStatus;
  }

  return "active";
}

function normalizeNumber(value: unknown) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return 0;
  }

  return Math.floor(numberValue);
}

function normalizeDate(value?: string | null) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  return normalized;
}

function createAssetNumber() {
  return `IT-${Date.now()}`;
}

function mapInventoryAssetRow(row: InventoryAssetRow): InventoryAsset {
  return {
    id: row.id,
    assetNumber: row.asset_number,
    name: row.name,
    type: normalizeType(row.type),
    status: normalizeStatus(row.status),
    manufacturer: row.manufacturer || "",
    model: row.model || "",
    serialNumber: row.serial_number || "",
    hostname: row.hostname || "",
    ipAddress: row.ip_address || "",
    location: row.location || "",
    assignedUserId: row.assigned_user_id || "",
    assignedUserName: row.assigned_user_name || "",
    companyId: row.company_id || "",
    departmentId: row.department_id || "",
    operatingSystem: row.operating_system || "",
    cpu: row.cpu || "",
    gpu: row.gpu || "",
    ramGb: Number(row.ram_gb || 0),
    storageGb: Number(row.storage_gb || 0),
    hardwareNotes: row.hardware_notes || "",
    softwareNotes: row.software_notes || "",
    purchaseDate: row.purchase_date || "",
    warrantyUntil: row.warranty_until || "",
    lastSeenAt: row.last_seen_at || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function ensureInventoryTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS inventory_assets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      asset_number TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'desktop',
      status TEXT NOT NULL DEFAULT 'active',
      manufacturer TEXT,
      model TEXT,
      serial_number TEXT,
      hostname TEXT,
      ip_address TEXT,
      location TEXT,
      assigned_user_id UUID,
      assigned_user_name TEXT,
      company_id UUID,
      department_id UUID,
      operating_system TEXT,
      cpu TEXT,
      gpu TEXT,
      ram_gb INTEGER NOT NULL DEFAULT 0,
      storage_gb INTEGER NOT NULL DEFAULT 0,
      hardware_notes TEXT,
      software_notes TEXT,
      purchase_date DATE,
      warranty_until DATE,
      last_seen_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS asset_number TEXT
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT ''
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'desktop'
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS manufacturer TEXT
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS model TEXT
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS serial_number TEXT
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS hostname TEXT
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS ip_address TEXT
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS location TEXT
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS assigned_user_id UUID
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS assigned_user_name TEXT
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS company_id UUID
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS department_id UUID
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS operating_system TEXT
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS cpu TEXT
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS ram_gb INTEGER NOT NULL DEFAULT 0
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS storage_gb INTEGER NOT NULL DEFAULT 0
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS hardware_notes TEXT
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS software_notes TEXT
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS purchase_date DATE
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS warranty_until DATE
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await query(`
    ALTER TABLE inventory_assets
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await query(`
    UPDATE inventory_assets
    SET asset_number = CONCAT('IT-', id::text)
    WHERE asset_number IS NULL
       OR TRIM(asset_number) = ''
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS inventory_assets_asset_number_key
    ON inventory_assets(asset_number)
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

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export async function GET(request: Request) {
  try {
    await requireAnyServerPermission([
      "inventory.view",
      "inventory.create",
      "inventory.edit",
      "inventory.assign",
      "inventory.hardware.manage",
      "inventory.software.manage",
      "inventory.servers.manage",
      "admin.view",
    ]);

    await ensureInventoryTables();

    const url = new URL(request.url);
    const search = normalizeText(url.searchParams.get("search"));
    const type = normalizeText(url.searchParams.get("type"));
    const status = normalizeText(url.searchParams.get("status"));
    const companyId = normalizeText(url.searchParams.get("companyId"));
    const departmentId = normalizeText(url.searchParams.get("departmentId"));
    const assignedUserId = normalizeText(url.searchParams.get("assignedUserId"));

    const params: unknown[] = [];
    const whereParts: string[] = [];

    if (search) {
      params.push(`%${search}%`);
      whereParts.push(`
        (
          asset_number ILIKE $${params.length}
          OR name ILIKE $${params.length}
          OR manufacturer ILIKE $${params.length}
          OR model ILIKE $${params.length}
          OR serial_number ILIKE $${params.length}
          OR hostname ILIKE $${params.length}
          OR ip_address ILIKE $${params.length}
          OR location ILIKE $${params.length}
          OR assigned_user_name ILIKE $${params.length}
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

    if (companyId) {
      params.push(companyId);
      whereParts.push(`company_id = $${params.length}`);
    }

    if (departmentId) {
      params.push(departmentId);
      whereParts.push(`department_id = $${params.length}`);
    }

    if (assignedUserId) {
      params.push(assignedUserId);
      whereParts.push(`assigned_user_id = $${params.length}`);
    }

    const whereSql =
      whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    const rows = await query<InventoryAssetRow>(
      `
        SELECT
          id,
          asset_number,
          name,
          type,
          status,
          manufacturer,
          model,
          serial_number,
          hostname,
          ip_address,
          location,
          assigned_user_id,
          assigned_user_name,
          company_id,
          department_id,
          operating_system,
          cpu,
          gpu,
          ram_gb,
          storage_gb,
          hardware_notes,
          software_notes,
          purchase_date::text,
          warranty_until::text,
          last_seen_at::text,
          created_at::text,
          updated_at::text
        FROM inventory_assets
        ${whereSql}
        ORDER BY updated_at DESC, created_at DESC
      `,
      params,
    );

    return NextResponse.json(rows.map(mapInventoryAssetRow));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "IT-Inventar konnte nicht geladen werden.",
        ),
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
    await requireAnyServerPermission(["inventory.create", "admin.view"]);

    await ensureInventoryTables();

    const body = (await request.json()) as InventoryAssetInput;

    const name = normalizeText(body.name);

    if (!name) {
      return NextResponse.json(
        {
          message: "Name ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const assetNumber = normalizeText(body.assetNumber) || createAssetNumber();

    const row = await queryOne<InventoryAssetRow>(
      `
        INSERT INTO inventory_assets (
          asset_number,
          name,
          type,
          status,
          manufacturer,
          model,
          serial_number,
          hostname,
          ip_address,
          location,
          assigned_user_id,
          assigned_user_name,
          company_id,
          department_id,
          operating_system,
          cpu,
          gpu,
          ram_gb,
          storage_gb,
          hardware_notes,
          software_notes,
          purchase_date,
          warranty_until,
          last_seen_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14,
          $15,
          $16,
          $17,
          $18,
          $19,
          $20,
          $21,
          $22,
          $23
        )
        RETURNING
          id,
          asset_number,
          name,
          type,
          status,
          manufacturer,
          model,
          serial_number,
          hostname,
          ip_address,
          location,
          assigned_user_id,
          assigned_user_name,
          company_id,
          department_id,
          operating_system,
          cpu,
          gpu,
          ram_gb,
          storage_gb,
          hardware_notes,
          software_notes,
          purchase_date::text,
          warranty_until::text,
          last_seen_at::text,
          created_at::text,
          updated_at::text
      `,
      [
        assetNumber,
        name,
        normalizeType(body.type),
        normalizeStatus(body.status),
        normalizeNullableText(body.manufacturer),
        normalizeNullableText(body.model),
        normalizeNullableText(body.serialNumber),
        normalizeNullableText(body.hostname),
        normalizeNullableText(body.ipAddress),
        normalizeNullableText(body.location),
        normalizeNullableText(body.assignedUserId),
        normalizeNullableText(body.assignedUserName),
        normalizeNullableText(body.companyId),
        normalizeNullableText(body.departmentId),
        normalizeNullableText(body.operatingSystem),
        normalizeNullableText(body.cpu),
        normalizeNullableText(body.gpu),
        normalizeNumber(body.ramGb),
        normalizeNumber(body.storageGb),
        normalizeNullableText(body.hardwareNotes),
        normalizeNullableText(body.softwareNotes),
        normalizeDate(body.purchaseDate),
        normalizeDate(body.warrantyUntil),
        normalizeDate(body.lastSeenAt),
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Inventar-Asset konnte nicht erstellt werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(mapInventoryAssetRow(row), {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Inventar-Asset konnte nicht erstellt werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}