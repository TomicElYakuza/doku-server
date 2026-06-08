import { query, queryOne } from "./db";
import { createSlug } from "./slug";
import {
  mapTaxonomyItemRow,
  type TaxonomyItemRow,
} from "./mappers/taxonomyMapper";
import type {
  TaxonomyCreateInput,
  TaxonomyItem,
  TaxonomyStatus,
  TaxonomyTarget,
  TaxonomyType,
  TaxonomyUpdateInput,
} from "../../types/taxonomy";

type TaxonomyListFilters = {
  type?: string | null;
  target?: string | null;
  status?: string | null;
  parentId?: string | null;
};

const allowedTypes: TaxonomyType[] = ["category", "tag"];

const allowedTargets: TaxonomyTarget[] = [
  "ticket",
  "wiki",
  "news",
  "global",
];

const allowedStatuses: TaxonomyStatus[] = [
  "active",
  "inactive",
  "archived",
];

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function normalizeNullableId(value: unknown) {
  const text = normalizeText(value);

  return text || null;
}

function normalizeType(value: unknown, fallback: TaxonomyType = "category") {
  if (allowedTypes.includes(value as TaxonomyType)) {
    return value as TaxonomyType;
  }

  return fallback;
}

function normalizeTarget(value: unknown, fallback: TaxonomyTarget = "ticket") {
  if (allowedTargets.includes(value as TaxonomyTarget)) {
    return value as TaxonomyTarget;
  }

  return fallback;
}

function normalizeStatus(value: unknown, fallback: TaxonomyStatus = "active") {
  if (allowedStatuses.includes(value as TaxonomyStatus)) {
    return value as TaxonomyStatus;
  }

  return fallback;
}

function normalizeSortOrder(value: unknown, fallback = 0) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.floor(numberValue);
}

function mapRows(rows: TaxonomyItemRow[]) {
  return rows.map(mapTaxonomyItemRow);
}

async function findRawTaxonomyItemById(id: string) {
  return queryOne<TaxonomyItemRow>(
    `
      SELECT
        id,
        type,
        target,
        name,
        slug,
        description,
        parent_id,
        sort_order,
        status,
        created_at,
        updated_at
      FROM taxonomy_items
      WHERE id = $1
    `,
    [id],
  );
}

async function assertParentIsValid(params: {
  parentId: string | null;
  type: TaxonomyType;
  target: TaxonomyTarget;
  currentId?: string;
}) {
  if (!params.parentId) {
    return null;
  }

  if (params.currentId && params.parentId === params.currentId) {
    throw new Error("Ein Eintrag kann nicht sein eigener Parent sein.");
  }

  const parent = await findRawTaxonomyItemById(params.parentId);

  if (!parent) {
    throw new Error("Parent-Eintrag wurde nicht gefunden.");
  }

  if (parent.type !== params.type || parent.target !== params.target) {
    throw new Error(
      "Parent-Eintrag muss denselben Typ und dasselbe Ziel haben.",
    );
  }

  if (params.currentId) {
    let currentParentId = parent.parent_id ? String(parent.parent_id) : "";
    let guard = 0;

    while (currentParentId && guard < 50) {
      if (currentParentId === params.currentId) {
        throw new Error(
          "Parent-Auswahl würde eine ungültige Kreisstruktur erzeugen.",
        );
      }

      const nextParent = await findRawTaxonomyItemById(currentParentId);

      if (!nextParent) {
        break;
      }

      currentParentId = nextParent.parent_id
        ? String(nextParent.parent_id)
        : "";
      guard += 1;
    }
  }

  return parent;
}

export async function ensureTaxonomyTable() {
  await query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto"
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS taxonomy_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type TEXT NOT NULL DEFAULT 'category',
      target TEXT NOT NULL DEFAULT 'ticket',
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      parent_id UUID REFERENCES taxonomy_items(id) ON DELETE SET NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    ALTER TABLE taxonomy_items
    ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'category'
  `);

  await query(`
    ALTER TABLE taxonomy_items
    ADD COLUMN IF NOT EXISTS target TEXT NOT NULL DEFAULT 'ticket'
  `);

  await query(`
    ALTER TABLE taxonomy_items
    ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''
  `);

  await query(`
    ALTER TABLE taxonomy_items
    ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES taxonomy_items(id) ON DELETE SET NULL
  `);

  await query(`
    ALTER TABLE taxonomy_items
    ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0
  `);

  await query(`
    ALTER TABLE taxonomy_items
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  `);

  await query(`
    ALTER TABLE taxonomy_items
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await query(`
    ALTER TABLE taxonomy_items
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await query(`
    UPDATE taxonomy_items
    SET
      type = CASE
        WHEN type IN ('category', 'tag') THEN type
        ELSE 'category'
      END,
      target = CASE
        WHEN target IN ('ticket', 'wiki', 'news', 'global') THEN target
        ELSE 'ticket'
      END,
      name = COALESCE(NULLIF(name, ''), 'Unbenannt'),
      slug = COALESCE(NULLIF(slug, ''), LOWER(REPLACE(name, ' ', '-'))),
      description = COALESCE(description, ''),
      sort_order = COALESCE(sort_order, 0),
      status = CASE
        WHEN status IN ('active', 'inactive', 'archived') THEN status
        ELSE 'active'
      END,
      created_at = COALESCE(created_at, NOW()),
      updated_at = COALESCE(updated_at, NOW())
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS taxonomy_items_target_type_status_idx
    ON taxonomy_items(target, type, status)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS taxonomy_items_parent_idx
    ON taxonomy_items(parent_id)
  `);
}

export async function listTaxonomyItems(filters: TaxonomyListFilters = {}) {
  await ensureTaxonomyTable();

  const params: unknown[] = [];
  const whereParts: string[] = [];

  if (filters.type) {
    params.push(normalizeType(filters.type));
    whereParts.push(`type = $${params.length}`);
  }

  if (filters.target) {
    params.push(normalizeTarget(filters.target, "ticket"));
    whereParts.push(`target = $${params.length}`);
  }

  if (filters.status) {
    params.push(normalizeStatus(filters.status));
    whereParts.push(`status = $${params.length}`);
  }

  if (filters.parentId) {
    params.push(filters.parentId);
    whereParts.push(`parent_id = $${params.length}`);
  }

  const whereSql =
    whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

  const rows = await query<TaxonomyItemRow>(
    `
      SELECT
        id,
        type,
        target,
        name,
        slug,
        description,
        parent_id,
        sort_order,
        status,
        created_at,
        updated_at
      FROM taxonomy_items
      ${whereSql}
      ORDER BY
        target ASC,
        type ASC,
        sort_order ASC,
        name ASC
    `,
    params,
  );

  return mapRows(rows);
}

export async function findTaxonomyItemById(id: string) {
  await ensureTaxonomyTable();

  const row = await findRawTaxonomyItemById(id);

  return row ? mapTaxonomyItemRow(row) : null;
}

export async function createTaxonomyItem(
  input: TaxonomyCreateInput,
): Promise<TaxonomyItem> {
  await ensureTaxonomyTable();

  const name = normalizeText(input.name);

  if (!name) {
    throw new Error("Name ist erforderlich.");
  }

  const type = normalizeType(input.type);
  const target = normalizeTarget(input.target);
  const parentId = normalizeNullableId(input.parentId);
  const slug = input.slug ? createSlug(input.slug) : createSlug(name);

  await assertParentIsValid({
    parentId,
    type,
    target,
  });

  const row = await queryOne<TaxonomyItemRow>(
    `
      INSERT INTO taxonomy_items (
        type,
        target,
        name,
        slug,
        description,
        parent_id,
        sort_order,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        type,
        target,
        name,
        slug,
        description,
        parent_id,
        sort_order,
        status,
        created_at,
        updated_at
    `,
    [
      type,
      target,
      name,
      slug,
      normalizeText(input.description),
      parentId,
      normalizeSortOrder(input.sortOrder),
      normalizeStatus(input.status),
    ],
  );

  if (!row) {
    throw new Error("Taxonomie-Eintrag konnte nicht erstellt werden.");
  }

  return mapTaxonomyItemRow(row);
}

export async function updateTaxonomyItem(
  id: string,
  input: TaxonomyUpdateInput,
): Promise<TaxonomyItem | null> {
  await ensureTaxonomyTable();

  const current = await findRawTaxonomyItemById(id);

  if (!current) {
    return null;
  }

  const nextName =
    input.name !== undefined ? normalizeText(input.name) : current.name;

  if (!nextName) {
    throw new Error("Name ist erforderlich.");
  }

  const nextType =
    input.type !== undefined
      ? normalizeType(input.type, current.type as TaxonomyType)
      : (current.type as TaxonomyType);

  const nextTarget =
    input.target !== undefined
      ? normalizeTarget(input.target, current.target as TaxonomyTarget)
      : (current.target as TaxonomyTarget);

  const nextParentId =
    input.parentId !== undefined
      ? normalizeNullableId(input.parentId)
      : current.parent_id
        ? String(current.parent_id)
        : null;

  await assertParentIsValid({
    parentId: nextParentId,
    type: nextType,
    target: nextTarget,
    currentId: id,
  });

  const nextSlug =
    input.slug !== undefined
      ? createSlug(input.slug || nextName)
      : current.slug || createSlug(nextName);

  const row = await queryOne<TaxonomyItemRow>(
    `
      UPDATE taxonomy_items
      SET
        type = $1,
        target = $2,
        name = $3,
        slug = $4,
        description = $5,
        parent_id = $6,
        sort_order = $7,
        status = $8,
        updated_at = NOW()
      WHERE id = $9
      RETURNING
        id,
        type,
        target,
        name,
        slug,
        description,
        parent_id,
        sort_order,
        status,
        created_at,
        updated_at
    `,
    [
      nextType,
      nextTarget,
      nextName,
      nextSlug,
      input.description !== undefined
        ? normalizeText(input.description)
        : current.description || "",
      nextParentId,
      input.sortOrder !== undefined
        ? normalizeSortOrder(input.sortOrder)
        : normalizeSortOrder(current.sort_order),
      input.status !== undefined
        ? normalizeStatus(input.status, current.status as TaxonomyStatus)
        : (current.status as TaxonomyStatus),
      id,
    ],
  );

  return row ? mapTaxonomyItemRow(row) : null;
}

export async function deleteTaxonomyItem(id: string) {
  await ensureTaxonomyTable();

  const child = await queryOne<{ id: string }>(
    `
      SELECT id
      FROM taxonomy_items
      WHERE parent_id = $1
      LIMIT 1
    `,
    [id],
  );

  if (child) {
    throw new Error(
      "Taxonomie-Eintrag hat Untereinträge und kann nicht gelöscht werden.",
    );
  }

  await queryOne<{ id: string }>(
    `
      DELETE FROM taxonomy_items
      WHERE id = $1
      RETURNING id
    `,
    [id],
  );
}