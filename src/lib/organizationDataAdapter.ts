import {
  applyPagination,
  createErrorResult,
  createLocalStorageAdapterMeta,
  createSuccessListResult,
  createSuccessResult,
  matchesSearchQuery,
} from "./dataAdapter";

import type {
  DataAdapter,
  DataAdapterQuery,
} from "./dataAdapter";

import {
  createCompany,
  createDepartment,
  deleteCompany,
  deleteDepartment,
  getCompanies,
  getCompanyById,
  getDepartmentById,
  getDepartments,
  updateCompany,
  updateDepartment,
} from "./companyStorage";

import type {
  Company,
  Department,
} from "./companyStorage";

function filterCompanies(
  companies: Company[],
  query?: DataAdapterQuery
) {
  if (!query) {
    return companies;
  }

  return companies.filter(
    (company) => {
      const matchesSearch =
        matchesSearchQuery(
          [
            company.name,
            company.slug,
            company.description,
            company.status,
          ],
          query.search
        );

      const matchesStatus =
        !query.status ||
        company.status === query.status;

      const matchesCompany =
        !query.companyId ||
        company.id === query.companyId;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCompany
      );
    }
  );
}

function filterDepartments(
  departments: Department[],
  query?: DataAdapterQuery
) {
  if (!query) {
    return departments;
  }

  return departments.filter(
    (department) => {
      const matchesSearch =
        matchesSearchQuery(
          [
            department.name,
            department.slug,
            department.description,
            department.status,
            department.companyId,
          ],
          query.search
        );

      const matchesCompany =
        !query.companyId ||
        department.companyId === query.companyId;

      const matchesDepartment =
        !query.departmentId ||
        department.id === query.departmentId;

      const matchesStatus =
        !query.status ||
        department.status === query.status;

      return (
        matchesSearch &&
        matchesCompany &&
        matchesDepartment &&
        matchesStatus
      );
    }
  );
}

export const companyLocalStorageAdapter: DataAdapter<Company> =
  {
    meta:
      createLocalStorageAdapterMeta(
        "company",
        "dms_companies"
      ),

    async list(
      query?: DataAdapterQuery
    ) {
      try {
        const companies =
          getCompanies();

        const filteredCompanies =
          filterCompanies(
            companies,
            query
          );

        return createSuccessListResult(
          applyPagination(
            filteredCompanies,
            query
          )
        );
      } catch {
        return {
          success:
            false,

          data:
            [],

          error:
            "Firmen konnten nicht geladen werden.",
        };
      }
    },

    async getById(
      id: string
    ) {
      try {
        return createSuccessResult(
          getCompanyById(
            id
          )
        );
      } catch {
        return createErrorResult<Company | null>(
          "Firma konnte nicht geladen werden."
        );
      }
    },

    async create(
      data
    ) {
      try {
        const company =
          createCompany(
            data
          );

        return createSuccessResult(
          company
        );
      } catch {
        return createErrorResult<Company>(
          "Firma konnte nicht erstellt werden."
        );
      }
    },

    async update(
      id: string,
      data: Partial<Company>
    ) {
      try {
        const company =
          updateCompany(
            id,
            data
          );

        return createSuccessResult(
          company
        );
      } catch {
        return createErrorResult<Company | null>(
          "Firma konnte nicht aktualisiert werden."
        );
      }
    },

    async delete(
      id: string
    ) {
      try {
        deleteCompany(
          id
        );

        return createSuccessResult(
          true
        );
      } catch {
        return createErrorResult<boolean>(
          "Firma konnte nicht gelöscht werden."
        );
      }
    },
  };

export const departmentLocalStorageAdapter: DataAdapter<Department> =
  {
    meta:
      createLocalStorageAdapterMeta(
        "department",
        "dms_departments"
      ),

    async list(
      query?: DataAdapterQuery
    ) {
      try {
        const departments =
          getDepartments();

        const filteredDepartments =
          filterDepartments(
            departments,
            query
          );

        return createSuccessListResult(
          applyPagination(
            filteredDepartments,
            query
          )
        );
      } catch {
        return {
          success:
            false,

          data:
            [],

          error:
            "Abteilungen konnten nicht geladen werden.",
        };
      }
    },

    async getById(
      id: string
    ) {
      try {
        return createSuccessResult(
          getDepartmentById(
            id
          )
        );
      } catch {
        return createErrorResult<Department | null>(
          "Abteilung konnte nicht geladen werden."
        );
      }
    },

    async create(
      data
    ) {
      try {
        const department =
          createDepartment(
            data
          );

        return createSuccessResult(
          department
        );
      } catch {
        return createErrorResult<Department>(
          "Abteilung konnte nicht erstellt werden."
        );
      }
    },

    async update(
      id: string,
      data: Partial<Department>
    ) {
      try {
        const department =
          updateDepartment(
            id,
            data
          );

        return createSuccessResult(
          department
        );
      } catch {
        return createErrorResult<Department | null>(
          "Abteilung konnte nicht aktualisiert werden."
        );
      }
    },

    async delete(
      id: string
    ) {
      try {
        deleteDepartment(
          id
        );

        return createSuccessResult(
          true
        );
      } catch {
        return createErrorResult<boolean>(
          "Abteilung konnte nicht gelöscht werden."
        );
      }
    },
  };

export function getCompanyAdapter() {
  return companyLocalStorageAdapter;
}

export function getDepartmentAdapter() {
  return departmentLocalStorageAdapter;
}