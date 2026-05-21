import type {
  Company,
  CompanyStatus,
  Department,
  DepartmentStatus,
} from "../../../types/company";

export type CompanyRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type DepartmentRow = {
  id: string;
  company_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export function mapCompanyRow(
  row: CompanyRow
): Company {
  return {
    id:
      row.id,

    name:
      row.name,

    slug:
      row.slug,

    description:
      row.description ||
      "",

    status:
      row.status as CompanyStatus,

    createdAt:
      new Date(
        row.created_at
      ).toLocaleString(),

    updatedAt:
      new Date(
        row.updated_at
      ).toLocaleString(),
  };
}

export function mapDepartmentRow(
  row: DepartmentRow
): Department {
  return {
    id:
      row.id,

    companyId:
      row.company_id ||
      "",

    name:
      row.name,

    slug:
      row.slug,

    description:
      row.description ||
      "",

    status:
      row.status as DepartmentStatus,

    createdAt:
      new Date(
        row.created_at
      ).toLocaleString(),

    updatedAt:
      new Date(
        row.updated_at
      ).toLocaleString(),
  };
}