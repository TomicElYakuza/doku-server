import type {
  Company,
  CompanyCreateInput,
  CompanyStatus,
  CompanyUpdateInput,
  Department,
  DepartmentCreateInput,
  DepartmentStatus,
  DepartmentUpdateInput,
} from "../types/company";

export type CompanyRepository = {
  listCompanies: () => Promise<Company[]>;
  listDepartments: () => Promise<Department[]>;

  searchCompanies: (query: string) => Promise<Company[]>;
  searchDepartments: (query: string) => Promise<Department[]>;

  findCompanyById: (id: string) => Promise<Company | null>;
  findDepartmentById: (id: string) => Promise<Department | null>;

  createCompany: (company: CompanyCreateInput) => Promise<Company>;
  updateCompany: (
    id: string,
    updates: CompanyUpdateInput
  ) => Promise<Company | null>;
  deleteCompany: (id: string) => Promise<void>;

  createDepartment: (department: DepartmentCreateInput) => Promise<Department>;
  updateDepartment: (
    id: string,
    updates: DepartmentUpdateInput
  ) => Promise<Department | null>;
  deleteDepartment: (id: string) => Promise<void>;

  saveCompanies: (companies: Company[]) => Promise<void>;
  saveDepartments: (departments: Department[]) => Promise<void>;

  resetCompanies: () => Promise<void>;
  resetDepartments: () => Promise<void>;

  listActiveCompanies: () => Promise<Company[]>;
  listActiveDepartments: () => Promise<Department[]>;
  listDepartmentsByCompanyId: (companyId: string) => Promise<Department[]>;
  listActiveDepartmentsByCompanyId: (companyId: string) => Promise<Department[]>;

  countCompanies: () => Promise<number>;
  countDepartments: () => Promise<number>;
  countActiveCompanies: () => Promise<number>;
  countActiveDepartments: () => Promise<number>;

  getCompanyStatusLabel: (status: CompanyStatus | string) => string;
  getDepartmentStatusLabel: (status: DepartmentStatus | string) => string;
};

async function requestJson<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response =
    await fetch(
      url,
      {
        ...options,

        headers: {
          "Content-Type":
            "application/json",

          ...(options?.headers || {}),
        },
      }
    );

  if (!response.ok) {
    let message =
      "Anfrage fehlgeschlagen.";

    try {
      const body =
        await response.json();

      message =
        body.message ||
        body.error ||
        message;
    } catch {
      // Keine JSON-Antwort vorhanden.
    }

    throw new Error(
      message
    );
  }

  return response.json() as Promise<T>;
}

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

function dispatchCompaniesUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(
      "companiesUpdated"
    )
  );
}

function dispatchDepartmentsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(
      "departmentsUpdated"
    )
  );
}

export const postgresCompanyRepository: CompanyRepository = {
  async listCompanies() {
    return requestJson<Company[]>(
      "/api/companies"
    );
  },

  async listDepartments() {
    return requestJson<Department[]>(
      "/api/departments"
    );
  },

  async searchCompanies(
    query: string
  ) {
    const companies =
      await postgresCompanyRepository.listCompanies();

    return companies.filter(
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

  async searchDepartments(
    query: string
  ) {
    const departments =
      await postgresCompanyRepository.listDepartments();

    return departments.filter(
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

  async findCompanyById(
    id: string
  ) {
    if (!id) {
      return null;
    }

    try {
      return await requestJson<Company>(
        `/api/companies/${encodeURIComponent(
          id
        )}`
      );
    } catch {
      return null;
    }
  },

  async findDepartmentById(
    id: string
  ) {
    if (!id) {
      return null;
    }

    try {
      return await requestJson<Department>(
        `/api/departments/${encodeURIComponent(
          id
        )}`
      );
    } catch {
      return null;
    }
  },

  async createCompany(
    company: CompanyCreateInput
  ) {
    const createdCompany =
      await requestJson<Company>(
        "/api/companies",
        {
          method:
            "POST",

          body:
            JSON.stringify(
              company
            ),
        }
      );

    dispatchCompaniesUpdated();

    return createdCompany;
  },

  async updateCompany(
    id: string,
    updates: CompanyUpdateInput
  ) {
    if (!id) {
      return null;
    }

    const updatedCompany =
      await requestJson<Company>(
        `/api/companies/${encodeURIComponent(
          id
        )}`,
        {
          method:
            "PATCH",

          body:
            JSON.stringify(
              updates
            ),
        }
      );

    dispatchCompaniesUpdated();

    return updatedCompany;
  },

  async deleteCompany(
    id: string
  ) {
    if (!id) {
      return;
    }

    await requestJson<{
      ok: boolean;
    }>(
      `/api/companies/${encodeURIComponent(
        id
      )}`,
      {
        method:
          "DELETE",
      }
    );

    dispatchCompaniesUpdated();
    dispatchDepartmentsUpdated();
  },

  async createDepartment(
    department: DepartmentCreateInput
  ) {
    const createdDepartment =
      await requestJson<Department>(
        "/api/departments",
        {
          method:
            "POST",

          body:
            JSON.stringify(
              department
            ),
        }
      );

    dispatchDepartmentsUpdated();

    return createdDepartment;
  },

  async updateDepartment(
    id: string,
    updates: DepartmentUpdateInput
  ) {
    if (!id) {
      return null;
    }

    const updatedDepartment =
      await requestJson<Department>(
        `/api/departments/${encodeURIComponent(
          id
        )}`,
        {
          method:
            "PATCH",

          body:
            JSON.stringify(
              updates
            ),
        }
      );

    dispatchDepartmentsUpdated();

    return updatedDepartment;
  },

  async deleteDepartment(
    id: string
  ) {
    if (!id) {
      return;
    }

    await requestJson<{
      ok: boolean;
    }>(
      `/api/departments/${encodeURIComponent(
        id
      )}`,
      {
        method:
          "DELETE",
      }
    );

    dispatchDepartmentsUpdated();
  },

  async saveCompanies(
    companies: Company[]
  ) {
    await Promise.all(
      companies.map(
        async (company) => {
          if (company.id) {
            await postgresCompanyRepository.updateCompany(
              company.id,
              company
            );

            return;
          }

          await postgresCompanyRepository.createCompany(
            company
          );
        }
      )
    );

    dispatchCompaniesUpdated();
  },

  async saveDepartments(
    departments: Department[]
  ) {
    await Promise.all(
      departments.map(
        async (department) => {
          if (department.id) {
            await postgresCompanyRepository.updateDepartment(
              department.id,
              department
            );

            return;
          }

          await postgresCompanyRepository.createDepartment(
            department
          );
        }
      )
    );

    dispatchDepartmentsUpdated();
  },

  async resetCompanies() {
    throw new Error(
      "resetCompanies ist für PostgreSQL nicht verfügbar."
    );
  },

  async resetDepartments() {
    throw new Error(
      "resetDepartments ist für PostgreSQL nicht verfügbar."
    );
  },

  async listActiveCompanies() {
    const companies =
      await postgresCompanyRepository.listCompanies();

    return companies.filter(
      (company) =>
        company.status === "active"
    );
  },

  async listActiveDepartments() {
    return requestJson<Department[]>(
      "/api/departments?active=true"
    );
  },

  async listDepartmentsByCompanyId(
    companyId: string
  ) {
    if (!companyId) {
      return postgresCompanyRepository.listDepartments();
    }

    return requestJson<Department[]>(
      `/api/departments?companyId=${encodeURIComponent(
        companyId
      )}`
    );
  },

  async listActiveDepartmentsByCompanyId(
    companyId: string
  ) {
    if (!companyId) {
      return postgresCompanyRepository.listActiveDepartments();
    }

    return requestJson<Department[]>(
      `/api/departments?companyId=${encodeURIComponent(
        companyId
      )}&active=true`
    );
  },

  async countCompanies() {
    const companies =
      await postgresCompanyRepository.listCompanies();

    return companies.length;
  },

  async countDepartments() {
    const departments =
      await postgresCompanyRepository.listDepartments();

    return departments.length;
  },

  async countActiveCompanies() {
    const companies =
      await postgresCompanyRepository.listActiveCompanies();

    return companies.length;
  },

  async countActiveDepartments() {
    const departments =
      await postgresCompanyRepository.listActiveDepartments();

    return departments.length;
  },

  getCompanyStatusLabel(
    status: CompanyStatus | string
  ) {
    if (status === "active") {
      return "Aktiv";
    }

    if (status === "inactive") {
      return "Inaktiv";
    }

    if (status === "archived") {
      return "Archiviert";
    }

    return String(
      status ||
        "Unbekannt"
    );
  },

  getDepartmentStatusLabel(
    status: DepartmentStatus | string
  ) {
    if (status === "active") {
      return "Aktiv";
    }

    if (status === "inactive") {
      return "Inaktiv";
    }

    if (status === "archived") {
      return "Archiviert";
    }

    return String(
      status ||
        "Unbekannt"
    );
  },
};

export const companyRepository =
  postgresCompanyRepository;
