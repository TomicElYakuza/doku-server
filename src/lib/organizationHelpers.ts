import {
  getCompanyById,
  getDepartmentById,
  getDepartmentsByCompanyId,
} from "./companyStorage";

import type {
  Company,
  Department,
} from "../types/company";

export type OrganizationReference = {
  companyId?: string;
  departmentId?: string;
  company?: string;
  department?: string;
};

export type OrganizationLabels = {
  companyId: string;
  departmentId: string;
  companyName: string;
  departmentName: string;
  companyLabel: string;
  departmentLabel: string;
  combinedLabel: string;
};

export function getCompanyNameByReference(
  reference: OrganizationReference
) {
  if (reference.companyId) {
    const company =
      getCompanyById(
        reference.companyId
      );

    if (company?.name) {
      return company.name;
    }
  }

  if (reference.company) {
    return reference.company;
  }

  return "Intern";
}

export function getDepartmentNameByReference(
  reference: OrganizationReference
) {
  if (reference.departmentId) {
    const department =
      getDepartmentById(
        reference.departmentId
      );

    if (department?.name) {
      return department.name;
    }
  }

  if (reference.department) {
    return reference.department;
  }

  return "Allgemein";
}

export function getOrganizationLabels(
  reference: OrganizationReference
): OrganizationLabels {
  const companyName =
    getCompanyNameByReference(
      reference
    );

  const departmentName =
    getDepartmentNameByReference(
      reference
    );

  return {
    companyId:
      reference.companyId || "",

    departmentId:
      reference.departmentId || "",

    companyName,

    departmentName,

    companyLabel:
      companyName,

    departmentLabel:
      departmentName,

    combinedLabel:
      `${companyName} / ${departmentName}`,
  };
}

export function getCompanyBadgeClass() {
  return "bg-emerald-50 text-emerald-700";
}

export function getDepartmentBadgeClass() {
  return "bg-indigo-50 text-indigo-700";
}

export function getOrganizationBadgeClasses() {
  return {
    company:
      getCompanyBadgeClass(),

    department:
      getDepartmentBadgeClass(),
  };
}

export function isSameCompany(
  first: OrganizationReference,
  second: OrganizationReference
) {
  if (
    first.companyId &&
    second.companyId
  ) {
    return (
      first.companyId ===
      second.companyId
    );
  }

  return (
    getCompanyNameByReference(first)
      .trim()
      .toLowerCase() ===
    getCompanyNameByReference(second)
      .trim()
      .toLowerCase()
  );
}

export function isSameDepartment(
  first: OrganizationReference,
  second: OrganizationReference
) {
  if (
    first.departmentId &&
    second.departmentId
  ) {
    return (
      first.departmentId ===
      second.departmentId
    );
  }

  return (
    getDepartmentNameByReference(first)
      .trim()
      .toLowerCase() ===
    getDepartmentNameByReference(second)
      .trim()
      .toLowerCase()
  );
}

export function matchesOrganizationSearch(
  reference: OrganizationReference,
  search: string
) {
  const query =
    search
      .trim()
      .toLowerCase();

  if (!query) {
    return true;
  }

  const labels =
    getOrganizationLabels(
      reference
    );

  return (
    labels.companyName
      .toLowerCase()
      .includes(query) ||
    labels.departmentName
      .toLowerCase()
      .includes(query) ||
    labels.combinedLabel
      .toLowerCase()
      .includes(query)
  );
}

export function matchesCompanyFilter(
  reference: OrganizationReference,
  companyId: string
) {
  if (!companyId) {
    return true;
  }

  if (
    reference.companyId &&
    reference.companyId === companyId
  ) {
    return true;
  }

  const company =
    getCompanyById(
      companyId
    );

  if (!company) {
    return false;
  }

  return (
    getCompanyNameByReference(reference)
      .trim()
      .toLowerCase() ===
    company.name
      .trim()
      .toLowerCase()
  );
}

export function matchesDepartmentFilter(
  reference: OrganizationReference,
  departmentId: string
) {
  if (!departmentId) {
    return true;
  }

  if (
    reference.departmentId &&
    reference.departmentId === departmentId
  ) {
    return true;
  }

  const department =
    getDepartmentById(
      departmentId
    );

  if (!department) {
    return false;
  }

  return (
    getDepartmentNameByReference(reference)
      .trim()
      .toLowerCase() ===
    department.name
      .trim()
      .toLowerCase()
  );
}

export function getDepartmentsForCompany(
  companyId: string,
  allDepartments: Department[]
) {
  if (!companyId) {
    return allDepartments;
  }

  return allDepartments.filter(
    (department) =>
      department.companyId === companyId
  );
}

export function getActiveDepartmentsForCompany(
  companyId: string,
  allDepartments: Department[]
) {
  return getDepartmentsForCompany(
    companyId,
    allDepartments
  ).filter(
    (department) =>
      department.status === "active"
  );
}

export function getFirstCompany(
  companies: Company[]
) {
  return (
    companies.find(
      (company) =>
        company.status === "active"
    ) ||
    companies[0] ||
    null
  );
}

export function getFirstDepartmentForCompany(
  companyId: string,
  departments: Department[]
) {
  if (companyId) {
    const departmentForCompany =
      departments.find(
        (department) =>
          department.companyId === companyId &&
          department.status === "active"
      );

    if (departmentForCompany) {
      return departmentForCompany;
    }
  }

  return (
    departments.find(
      (department) =>
        department.status === "active"
    ) ||
    departments[0] ||
    null
  );
}

export function normalizeOrganizationReference(
  reference: OrganizationReference
): OrganizationReference {
  const companyName =
    getCompanyNameByReference(
      reference
    );

  const departmentName =
    getDepartmentNameByReference(
      reference
    );

  return {
    companyId:
      reference.companyId || "",

    departmentId:
      reference.departmentId || "",

    company:
      companyName,

    department:
      departmentName,
  };
}

export function getDepartmentCompanyName(
  departmentId: string
) {
  const department =
    getDepartmentById(
      departmentId
    );

  if (!department) {
    return "";
  }

  const company =
    getCompanyById(
      department.companyId
    );

  return (
    company?.name ||
    ""
  );
}

export function getCompanyDepartmentCount(
  companyId: string
) {
  return getDepartmentsByCompanyId(
    companyId
  ).length;
}