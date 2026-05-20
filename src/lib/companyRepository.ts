import {
  createCompany,
  createDepartment,
  deleteCompany,
  deleteDepartment,
  getActiveCompanies,
  getActiveDepartments,
  getActiveDepartmentsByCompanyId,
  getCompanies,
  getCompanyById,
  getCompanyStatusLabel,
  getDepartmentById,
  getDepartmentStatusLabel,
  getDepartments,
  getDepartmentsByCompanyId,
  resetCompanies,
  resetDepartments,
  saveCompanies,
  saveDepartments,
  updateCompany,
  updateDepartment,
} from "./companyStorage";

import type {
  Company,
  CompanyStatus,
  Department,
  DepartmentStatus,
} from "./companyStorage";

export type CompanyCreateInput = Omit<
  Company,
  "id" | "createdAt" | "updatedAt"
>;

export type CompanyUpdateInput =
  Partial<
    Omit<
      Company,
      "id" | "createdAt" | "updatedAt"
    >
  >;

export type DepartmentCreateInput = Omit<
  Department,
  "id" | "createdAt" | "updatedAt"
>;

export type DepartmentUpdateInput =
  Partial<
    Omit<
      Department,
      "id" | "createdAt" | "updatedAt"
    >
  >;

export type CompanyRepository = {
  listCompanies: () => Company[];
  listDepartments: () => Department[];

  searchCompanies: (query: string) => Company[];
  searchDepartments: (query: string) => Department[];

  findCompanyById: (id: string) => Company | null;
  findDepartmentById: (id: string) => Department | null;

  createCompany: (company: CompanyCreateInput) => Company;
  updateCompany: (
    id: string,
    updates: CompanyUpdateInput
  ) => Company | null;
  deleteCompany: (id: string) => void;

  createDepartment: (department: DepartmentCreateInput) => Department;
  updateDepartment: (
    id: string,
    updates: DepartmentUpdateInput
  ) => Department | null;
  deleteDepartment: (id: string) => void;

  saveCompanies: (companies: Company[]) => void;
  saveDepartments: (departments: Department[]) => void;

  resetCompanies: () => void;
  resetDepartments: () => void;

  listActiveCompanies: () => Company[];
  listActiveDepartments: () => Department[];
  listDepartmentsByCompanyId: (companyId: string) => Department[];
  listActiveDepartmentsByCompanyId: (companyId: string) => Department[];

  countCompanies: () => number;
  countDepartments: () => number;
  countActiveCompanies: () => number;
  countActiveDepartments: () => number;

  getCompanyStatusLabel: (status: CompanyStatus | string) => string;
  getDepartmentStatusLabel: (status: DepartmentStatus | string) => string;
};

function matchesQuery(
  values: unknown[],
  query: string
) {
  const normalizedQuery =
    query
      .trim()
      .toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return values
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(
      normalizedQuery
    );
}

export const localCompanyRepository: CompanyRepository = {
  listCompanies() {
    return getCompanies();
  },

  listDepartments() {
    return getDepartments();
  },

  searchCompanies(
    query: string
  ) {
    return getCompanies().filter(
      (company) =>
        matchesQuery(
          [
            company.id,
            company.name,
            company.slug,
            company.description,
            company.status,
            company.createdAt,
            company.updatedAt,
          ],
          query
        )
    );
  },

  searchDepartments(
    query: string
  ) {
    return getDepartments().filter(
      (department) =>
        matchesQuery(
          [
            department.id,
            department.companyId,
            department.name,
            department.slug,
            department.description,
            department.status,
            department.createdAt,
            department.updatedAt,
          ],
          query
        )
    );
  },

  findCompanyById(
    id: string
  ) {
    return getCompanyById(
      id
    );
  },

  findDepartmentById(
    id: string
  ) {
    return getDepartmentById(
      id
    );
  },

  createCompany(
    company: CompanyCreateInput
  ) {
    return createCompany(
      company
    );
  },

  updateCompany(
    id: string,
    updates: CompanyUpdateInput
  ) {
    return updateCompany(
      id,
      updates
    );
  },

  deleteCompany(
    id: string
  ) {
    deleteCompany(
      id
    );
  },

  createDepartment(
    department: DepartmentCreateInput
  ) {
    return createDepartment(
      department
    );
  },

  updateDepartment(
    id: string,
    updates: DepartmentUpdateInput
  ) {
    return updateDepartment(
      id,
      updates
    );
  },

  deleteDepartment(
    id: string
  ) {
    deleteDepartment(
      id
    );
  },

  saveCompanies(
    companies: Company[]
  ) {
    saveCompanies(
      companies
    );
  },

  saveDepartments(
    departments: Department[]
  ) {
    saveDepartments(
      departments
    );
  },

  resetCompanies() {
    resetCompanies();
  },

  resetDepartments() {
    resetDepartments();
  },

  listActiveCompanies() {
    return getActiveCompanies();
  },

  listActiveDepartments() {
    return getActiveDepartments();
  },

  listDepartmentsByCompanyId(
    companyId: string
  ) {
    return getDepartmentsByCompanyId(
      companyId
    );
  },

  listActiveDepartmentsByCompanyId(
    companyId: string
  ) {
    return getActiveDepartmentsByCompanyId(
      companyId
    );
  },

  countCompanies() {
    return getCompanies().length;
  },

  countDepartments() {
    return getDepartments().length;
  },

  countActiveCompanies() {
    return getActiveCompanies().length;
  },

  countActiveDepartments() {
    return getActiveDepartments().length;
  },

  getCompanyStatusLabel(
    status: CompanyStatus | string
  ) {
    return getCompanyStatusLabel(
      status
    );
  },

  getDepartmentStatusLabel(
    status: DepartmentStatus | string
  ) {
    return getDepartmentStatusLabel(
      status
    );
  },
};

export const companyRepository =
  localCompanyRepository;