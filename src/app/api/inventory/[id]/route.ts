import { NextResponse } from "next/server";

import { queryOne } from "../../../../lib/database/db";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";
import type {
  InventoryAsset,
  InventoryAssetInput,
  InventoryAssetStatus,
  InventoryAssetType,
} from "../../../../types/inventory";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

function normalizeType(
  value?: string | null,
  fallback: InventoryAssetType = "desktop",
): InventoryAssetType {
  if (assetTypes.has(String(value || ""))) {
    return value as InventoryAssetType;
  }

  return fallback;
}

function normalizeStatus(
  value?: string | null,
  fallback: InventoryAssetStatus = "active",
): InventoryAssetStatus {
  if (assetStatuses.has(String(value || ""))) {
    return value as InventoryAssetStatus;
  }

  return fallback;
}

function normalizeNumber(value: unknown, fallback: unknown) {
  const numberValue = Number(value);

  if (Number.isFinite(numberValue) && numberValue >= 0) {
    return Math.floor(numberValue);
  }

  const fallbackValue = Number(fallback);

  if (Number.isFinite(fallbackValue) && fallbackValue >= 0) {
    return Math.floor(fallbackValue);
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

async function findInventoryAsset(id: string) {
  return queryOne<InventoryAssetRow>(
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

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAnyServerPermission([
      "inventory.view",
      "inventory.edit",
      "inventory.assign",
      "admin.view",
    ]);

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);

    const row = await findInventoryAsset(decodedId);

    if (!row) {
      return NextResponse.json(
        {
          message: "Inventar-Asset wurde nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(mapInventoryAssetRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Inventar-Asset konnte nicht geladen werden.",
        ),
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
      "inventory.edit",
      "inventory.assign",
      "inventory.hardware.manage",
      "inventory.software.manage",
      "admin.view",
    ]);

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);
    const body = (await request.json()) as InventoryAssetInput;

    const currentRow = await findInventoryAsset(decodedId);

    if (!currentRow) {
      return NextResponse.json(
        {
          message: "Inventar-Asset wurde nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    const nextName =
      body.name !== undefined ? normalizeText(body.name) : currentRow.name;

    if (!nextName) {
      return NextResponse.json(
        {
          message: "Name ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const row = await queryOne<InventoryAssetRow>(
      `
        UPDATE inventory_assets
        SET
          asset_number = $1,
          name = $2,
          type = $3,
          status = $4,
          manufacturer = $5,
          model = $6,
          serial_number = $7,
          hostname = $8,
          ip_address = $9,
          location = $10,
          assigned_user_id = $11,
          assigned_user_name = $12,
          company_id = $13,
          department_id = $14,
          operating_system = $15,
          cpu = $16,
          ram_gb = $17,
          storage_gb = $18,
          hardware_notes = $19,
          software_notes = $20,
          purchase_date = $21,
          warranty_until = $22,
          last_seen_at = $23,
          updated_at = NOW()
        WHERE id = $24
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
        body.assetNumber !== undefined
          ? normalizeText(body.assetNumber)
          : currentRow.asset_number,
        nextName,
        body.type !== undefined
          ? normalizeType(body.type, normalizeType(currentRow.type))
          : normalizeType(currentRow.type),
        body.status !== undefined
          ? normalizeStatus(body.status, normalizeStatus(currentRow.status))
          : normalizeStatus(currentRow.status),
        body.manufacturer !== undefined
          ? normalizeNullableText(body.manufacturer)
          : currentRow.manufacturer,
        body.model !== undefined
          ? normalizeNullableText(body.model)
          : currentRow.model,
        body.serialNumber !== undefined
          ? normalizeNullableText(body.serialNumber)
          : currentRow.serial_number,
        body.hostname !== undefined
          ? normalizeNullableText(body.hostname)
          : currentRow.hostname,
        body.ipAddress !== undefined
          ? normalizeNullableText(body.ipAddress)
          : currentRow.ip_address,
        body.location !== undefined
          ? normalizeNullableText(body.location)
          : currentRow.location,
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
        body.operatingSystem !== undefined
          ? normalizeNullableText(body.operatingSystem)
          : currentRow.operating_system,
        body.cpu !== undefined ? normalizeNullableText(body.cpu) : currentRow.cpu,
        body.gpu !== undefined ? normalizeNullableText(body.gpu) : currentRow.gpu,
        body.ramGb !== undefined
          ? normalizeNumber(body.ramGb, currentRow.ram_gb)
          : normalizeNumber(currentRow.ram_gb, 0),
        body.storageGb !== undefined
          ? normalizeNumber(body.storageGb, currentRow.storage_gb)
          : normalizeNumber(currentRow.storage_gb, 0),
        body.hardwareNotes !== undefined
          ? normalizeNullableText(body.hardwareNotes)
          : currentRow.hardware_notes,
        body.softwareNotes !== undefined
          ? normalizeNullableText(body.softwareNotes)
          : currentRow.software_notes,
        body.purchaseDate !== undefined
          ? normalizeDate(body.purchaseDate)
          : normalizeDate(currentRow.purchase_date),
        body.warrantyUntil !== undefined
          ? normalizeDate(body.warrantyUntil)
          : normalizeDate(currentRow.warranty_until),
        body.lastSeenAt !== undefined
          ? normalizeDate(body.lastSeenAt)
          : normalizeDate(currentRow.last_seen_at),
        decodedId,
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Inventar-Asset konnte nicht gespeichert werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(mapInventoryAssetRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Inventar-Asset konnte nicht gespeichert werden.",
        ),
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
    await requireAnyServerPermission(["inventory.delete", "admin.view"]);

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);

    const deleted = await queryOne<{ id: string }>(
      `
        DELETE FROM inventory_assets
        WHERE id = $1
        RETURNING id
      `,
      [decodedId],
    );

    if (!deleted) {
      return NextResponse.json(
        {
          message: "Inventar-Asset wurde nicht gefunden.",
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
        message: getErrorMessage(
          error,
          "Inventar-Asset konnte nicht gelöscht werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}