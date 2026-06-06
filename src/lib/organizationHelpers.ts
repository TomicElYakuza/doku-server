import type {
  Company,
  Department,
} from "../types/company";

import type {
  Ticket,
} from "../types/ticket";

type OrganizationLabelSource = {
  company?: string;
  department?: string;
  companyId?: string;
  departmentId?: string;
};

export function getCompanyNameById(
  companies: Company[],
  companyId?: string
) {
  if (!companyId) {
    return "";
  }

  return (
    companies.find(
      (company) =>
        company.id === companyId
    )?.name ||
    ""
  );
}

export function getDepartmentNameById(
  departments: Department[],
  departmentId?: string
) {
  if (!departmentId) {
    return "";
  }

  return (
    departments.find(
      (department) =>
        department.id === departmentId
    )?.name ||
    ""
  );
}

export function getDepartmentsForCompany(
  departments: Department[],
  companyId?: string
) {
  if (!companyId) {
    return departments;
  }

  return departments.filter(
    (department) =>
      department.companyId === companyId
  );
}

export function getActiveCompanies(
  companies: Company[]
) {
  return companies.filter(
    (company) =>
      company.status === "active"
  );
}

export function getActiveDepartments(
  departments: Department[]
) {
  return departments.filter(
    (department) =>
      department.status === "active"
  );
}

export function getActiveDepartmentsForCompany(
  departments: Department[],
  companyId?: string
) {
  return getDepartmentsForCompany(
    getActiveDepartments(
      departments
    ),
    companyId
  );
}

export function enrichTicketWithOrganization(
  ticket: Ticket,
  companies: Company[],
  departments: Department[]
): Ticket {
  const companyName =
    getCompanyNameById(
      companies,
      ticket.companyId
    ) ||
    ticket.company ||
    "Intern";

  const departmentName =
    getDepartmentNameById(
      departments,
      ticket.departmentId
    ) ||
    ticket.department ||
    "";

  return {
    ...ticket,

    company:
      companyName,

    department:
      departmentName,
  };
}

export function getCompanyDepartmentLabel(
  company?: string,
  department?: string
) {
  const nextCompany =
    company ||
    "Intern";

  const nextDepartment =
    department ||
    "";

  return `${nextCompany} Â· ${nextDepartment}`;
}

export function getOrganizationLabels(
  source?: OrganizationLabelSource | null
) {
  const company =
    source?.company ||
    "Intern";

  const department =
    source?.department ||
    "";

  return {
    company,

    department,

    companyLabel:
      company,

    departmentLabel:
      department,

    label:
      getCompanyDepartmentLabel(
        company,
        department
      ),
  };
}

export function getOrganizationLabel(
  source?: OrganizationLabelSource | null
) {
  return getOrganizationLabels(
    source
  ).label;
}

