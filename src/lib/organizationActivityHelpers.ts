import {
  saveActivity,
} from "./activityStorage";

import type {
  Company,
  Department,
} from "./companyStorage";

import {
  getCurrentUser,
} from "./permissions";

type OrganizationActivityAction =
  | "created"
  | "updated"
  | "deleted";

function getUserContext() {
  const user =
    getCurrentUser();

  return {
    userName:
      user?.name ||
      "Unbekannt",

    userEmail:
      user?.email ||
      "",

    user:
      user?.name ||
      "Unbekannt",

    companyId:
      user?.companyId ||
      "",

    departmentId:
      user?.departmentId ||
      "",

    company:
      user?.company ||
      "Intern",

    department:
      user?.department ||
      "Allgemein",
  };
}

function getCompanyActivityType(
  action: OrganizationActivityAction
) {
  if (action === "created") {
    return "company_created";
  }

  if (action === "updated") {
    return "company_updated";
  }

  if (action === "deleted") {
    return "company_deleted";
  }

  return "system";
}

function getDepartmentActivityType(
  action: OrganizationActivityAction
) {
  if (action === "created") {
    return "department_created";
  }

  if (action === "updated") {
    return "department_updated";
  }

  if (action === "deleted") {
    return "department_deleted";
  }

  return "system";
}

function getCompanyActivityTitle(
  action: OrganizationActivityAction,
  company: Company
) {
  if (action === "created") {
    return `Firma erstellt: ${company.name}`;
  }

  if (action === "updated") {
    return `Firma aktualisiert: ${company.name}`;
  }

  if (action === "deleted") {
    return `Firma gelöscht: ${company.name}`;
  }

  return company.name;
}

function getDepartmentActivityTitle(
  action: OrganizationActivityAction,
  department: Department
) {
  if (action === "created") {
    return `Abteilung erstellt: ${department.name}`;
  }

  if (action === "updated") {
    return `Abteilung aktualisiert: ${department.name}`;
  }

  if (action === "deleted") {
    return `Abteilung gelöscht: ${department.name}`;
  }

  return department.name;
}

export function saveCompanyActivity(
  action: OrganizationActivityAction,
  company: Company,
  description?: string
) {
  const userContext =
    getUserContext();

  saveActivity({
    type:
      getCompanyActivityType(
        action
      ),

    title:
      getCompanyActivityTitle(
        action,
        company
      ),

    description:
      description ||
      company.description ||
      "",

    entityId:
      company.id,

    entityType:
      "company",

    userName:
      userContext.userName,

    userEmail:
      userContext.userEmail,

    user:
      userContext.user,

    companyId:
      company.id ||
      userContext.companyId,

    departmentId:
      userContext.departmentId,

    company:
      company.name ||
      userContext.company,

    department:
      userContext.department,

    metadata:
      {
        companyId:
          company.id,

        companyName:
          company.name,

        status:
          company.status,
      },
  });
}

export function saveDepartmentActivity(
  action: OrganizationActivityAction,
  department: Department,
  companyName?: string,
  description?: string
) {
  const userContext =
    getUserContext();

  saveActivity({
    type:
      getDepartmentActivityType(
        action
      ),

    title:
      getDepartmentActivityTitle(
        action,
        department
      ),

    description:
      description ||
      department.description ||
      "",

    entityId:
      department.id,

    entityType:
      "department",

    userName:
      userContext.userName,

    userEmail:
      userContext.userEmail,

    user:
      userContext.user,

    companyId:
      department.companyId ||
      userContext.companyId,

    departmentId:
      department.id ||
      userContext.departmentId,

    company:
      companyName ||
      userContext.company,

    department:
      department.name ||
      userContext.department,

    metadata:
      {
        departmentId:
          department.id,

        departmentName:
          department.name,

        companyId:
          department.companyId,

        status:
          department.status,
      },
  });
}

export function saveCompanyCreatedActivity(
  company: Company
) {
  saveCompanyActivity(
    "created",
    company,
    "Eine neue Firma wurde erstellt."
  );
}

export function saveCompanyUpdatedActivity(
  company: Company
) {
  saveCompanyActivity(
    "updated",
    company,
    "Eine Firma wurde aktualisiert."
  );
}

export function saveCompanyDeletedActivity(
  company: Company
) {
  saveCompanyActivity(
    "deleted",
    company,
    "Eine Firma wurde gelöscht."
  );
}

export function saveDepartmentCreatedActivity(
  department: Department,
  companyName?: string
) {
  saveDepartmentActivity(
    "created",
    department,
    companyName,
    "Eine neue Abteilung wurde erstellt."
  );
}

export function saveDepartmentUpdatedActivity(
  department: Department,
  companyName?: string
) {
  saveDepartmentActivity(
    "updated",
    department,
    companyName,
    "Eine Abteilung wurde aktualisiert."
  );
}

export function saveDepartmentDeletedActivity(
  department: Department,
  companyName?: string
) {
  saveDepartmentActivity(
    "deleted",
    department,
    companyName,
    "Eine Abteilung wurde gelöscht."
  );
}