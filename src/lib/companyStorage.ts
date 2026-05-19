export type CompanyStatus =
  | "active"
  | "inactive"
  | "archived";

export type DepartmentStatus =
  | "active"
  | "inactive"
  | "archived";

export type Company = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: CompanyStatus;
  createdAt: string;
  updatedAt: string;
};

export type Department = {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  description?: string;
  status: DepartmentStatus;
  createdAt: string;
  updatedAt: string;
};

const COMPANIES_STORAGE_KEY =
  "dms_companies";

const DEPARTMENTS_STORAGE_KEY =
  "dms_departments";

const defaultCompanies: Company[] = [
  {
    id:
      "company-intern",

    name:
      "Intern",

    slug:
      "intern",

    description:
      "Interne Organisation für Demo-Daten, Benutzer, Tickets und Wiki.",

    status:
      "active",

    createdAt:
      new Date().toLocaleString(),

    updatedAt:
      new Date().toLocaleString(),
  },
];

const defaultDepartments: Department[] = [
  {
    id:
      "department-it",

    companyId:
      "company-intern",

    name:
      "IT",

    slug:
      "it",

    description:
      "Interne IT-Abteilung.",

    status:
      "active",

    createdAt:
      new Date().toLocaleString(),

    updatedAt:
      new Date().toLocaleString(),
  },

  {
    id:
      "department-support",

    companyId:
      "company-intern",

    name:
      "Support",

    slug:
      "support",

    description:
      "Support und Benutzerhilfe.",

    status:
      "active",

    createdAt:
      new Date().toLocaleString(),

    updatedAt:
      new Date().toLocaleString(),
  },

  {
    id:
      "department-office",

    companyId:
      "company-intern",

    name:
      "Office",

    slug:
      "office",

    description:
      "Office, Verwaltung und Dokumentation.",

    status:
      "active",

    createdAt:
      new Date().toLocaleString(),

    updatedAt:
      new Date().toLocaleString(),
  },
];

function dispatchCompaniesUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("companiesUpdated")
  );
}

function dispatchDepartmentsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event("departmentsUpdated")
  );
}

function createId(
  prefix: string
) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function createSlug(
  value: string
) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCompanyStatus(
  value: unknown
): CompanyStatus {
  if (value === "active") {
    return "active";
  }

  if (value === "inactive") {
    return "inactive";
  }

  if (value === "archived") {
    return "archived";
  }

  return "active";
}

function normalizeDepartmentStatus(
  value: unknown
): DepartmentStatus {
  if (value === "active") {
    return "active";
  }

  if (value === "inactive") {
    return "inactive";
  }

  if (value === "archived") {
    return "archived";
  }

  return "active";
}

function normalizeCompany(
  company: Partial<Company>
): Company {
  const now =
    new Date().toLocaleString();

  const name =
    company.name ||
    "Unbenannte Firma";

  return {
    id:
      company.id ||
      createId("company"),

    name,

    slug:
      company.slug ||
      createSlug(name),

    description:
      company.description ||
      "",

    status:
      normalizeCompanyStatus(
        company.status
      ),

    createdAt:
      company.createdAt ||
      now,

    updatedAt:
      company.updatedAt ||
      now,
  };
}

function normalizeDepartment(
  department: Partial<Department>
): Department {
  const now =
    new Date().toLocaleString();

  const name =
    department.name ||
    "Unbenannte Abteilung";

  return {
    id:
      department.id ||
      createId("department"),

    companyId:
      department.companyId ||
      "company-intern",

    name,

    slug:
      department.slug ||
      createSlug(name),

    description:
      department.description ||
      "",

    status:
      normalizeDepartmentStatus(
        department.status
      ),

    createdAt:
      department.createdAt ||
      now,

    updatedAt:
      department.updatedAt ||
      now,
  };
}

export function getCompanies(): Company[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw =
    localStorage.getItem(
      COMPANIES_STORAGE_KEY
    );

  if (!raw) {
    localStorage.setItem(
      COMPANIES_STORAGE_KEY,
      JSON.stringify(
        defaultCompanies
      )
    );

    return defaultCompanies.map(
      (company) =>
        normalizeCompany(
          company
        )
    );
  }

  try {
    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(
      (company) =>
        normalizeCompany(
          company
        )
    );
  } catch {
    return [];
  }
}

export function saveCompanies(
  companies: Company[]
) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedCompanies =
    companies.map(
      (company) =>
        normalizeCompany(
          company
        )
    );

  localStorage.setItem(
    COMPANIES_STORAGE_KEY,
    JSON.stringify(
      normalizedCompanies
    )
  );

  dispatchCompaniesUpdated();
}

export function getDepartments(): Department[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw =
    localStorage.getItem(
      DEPARTMENTS_STORAGE_KEY
    );

  if (!raw) {
    localStorage.setItem(
      DEPARTMENTS_STORAGE_KEY,
      JSON.stringify(
        defaultDepartments
      )
    );

    return defaultDepartments.map(
      (department) =>
        normalizeDepartment(
          department
        )
    );
  }

  try {
    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(
      (department) =>
        normalizeDepartment(
          department
        )
    );
  } catch {
    return [];
  }
}

export function saveDepartments(
  departments: Department[]
) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedDepartments =
    departments.map(
      (department) =>
        normalizeDepartment(
          department
        )
    );

  localStorage.setItem(
    DEPARTMENTS_STORAGE_KEY,
    JSON.stringify(
      normalizedDepartments
    )
  );

  dispatchDepartmentsUpdated();
}

export function resetCompanies() {
  saveCompanies(
    defaultCompanies
  );
}

export function resetDepartments() {
  saveDepartments(
    defaultDepartments
  );
}

export function clearCompanies() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    COMPANIES_STORAGE_KEY
  );

  dispatchCompaniesUpdated();
}

export function clearDepartments() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    DEPARTMENTS_STORAGE_KEY
  );

  dispatchDepartmentsUpdated();
}

export function getCompanyById(
  id: string
): Company | null {
  return (
    getCompanies().find(
      (company) =>
        company.id === id
    ) || null
  );
}

export function getDepartmentById(
  id: string
): Department | null {
  return (
    getDepartments().find(
      (department) =>
        department.id === id
    ) || null
  );
}

export function getDepartmentsByCompanyId(
  companyId: string
): Department[] {
  return getDepartments().filter(
    (department) =>
      department.companyId === companyId
  );
}

export function getActiveCompanies(): Company[] {
  return getCompanies().filter(
    (company) =>
      company.status === "active"
  );
}

export function getActiveDepartments(): Department[] {
  return getDepartments().filter(
    (department) =>
      department.status === "active"
  );
}

export function getActiveDepartmentsByCompanyId(
  companyId: string
): Department[] {
  return getDepartmentsByCompanyId(
    companyId
  ).filter(
    (department) =>
      department.status === "active"
  );
}

export function createCompany(
  company: Omit<
    Company,
    "id" | "createdAt" | "updatedAt"
  >
): Company {
  const companies =
    getCompanies();

  const now =
    new Date().toLocaleString();

  const newCompany =
    normalizeCompany({
      ...company,

      id:
        createId("company"),

      createdAt:
        now,

      updatedAt:
        now,
    });

  saveCompanies([
    newCompany,
    ...companies,
  ]);

  return newCompany;
}

export function updateCompany(
  id: string,
  updates: Partial<Company>
): Company | null {
  const companies =
    getCompanies();

  let updatedCompany:
    | Company
    | null = null;

  const updatedCompanies =
    companies.map(
      (company) => {
        if (company.id !== id) {
          return company;
        }

        const nextCompany =
          normalizeCompany({
            ...company,
            ...updates,

            id:
              company.id,

            createdAt:
              company.createdAt,

            updatedAt:
              new Date().toLocaleString(),
          });

        updatedCompany =
          nextCompany;

        return nextCompany;
      }
    );

  saveCompanies(
    updatedCompanies
  );

  return updatedCompany;
}

export function deleteCompany(
  id: string
) {
  const companies =
    getCompanies();

  const departments =
    getDepartments();

  saveCompanies(
    companies.filter(
      (company) =>
        company.id !== id
    )
  );

  saveDepartments(
    departments.filter(
      (department) =>
        department.companyId !== id
    )
  );
}

export function createDepartment(
  department: Omit<
    Department,
    "id" | "createdAt" | "updatedAt"
  >
): Department {
  const departments =
    getDepartments();

  const now =
    new Date().toLocaleString();

  const newDepartment =
    normalizeDepartment({
      ...department,

      id:
        createId("department"),

      createdAt:
        now,

      updatedAt:
        now,
    });

  saveDepartments([
    newDepartment,
    ...departments,
  ]);

  return newDepartment;
}

export function updateDepartment(
  id: string,
  updates: Partial<Department>
): Department | null {
  const departments =
    getDepartments();

  let updatedDepartment:
    | Department
    | null = null;

  const updatedDepartments =
    departments.map(
      (department) => {
        if (department.id !== id) {
          return department;
        }

        const nextDepartment =
          normalizeDepartment({
            ...department,
            ...updates,

            id:
              department.id,

            createdAt:
              department.createdAt,

            updatedAt:
              new Date().toLocaleString(),
          });

        updatedDepartment =
          nextDepartment;

        return nextDepartment;
      }
    );

  saveDepartments(
    updatedDepartments
  );

  return updatedDepartment;
}

export function deleteDepartment(
  id: string
) {
  const departments =
    getDepartments();

  saveDepartments(
    departments.filter(
      (department) =>
        department.id !== id
    )
  );
}

export function getCompanyStatusLabel(
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

  return "Unbekannt";
}

export function getDepartmentStatusLabel(
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

  return "Unbekannt";
}