import {
  activityRepository,
} from "./activityRepository";

import type {
  Company,
  Department,
} from "../types/company";

type ActivityPayload = {
  type: string;
  title: string;
  description: string;
  entityType: string;
  entityId: string;
  userName: string;
  userEmail: string;
  user: string;
  companyId: string;
  departmentId: string;
  company: string;
  department: string;
  metadata: Record<
    string,
    string | number | boolean | null
  >;
};

function createOrganizationActivity(
  payload: ActivityPayload
) {
  void activityRepository
    .create({
      type:
        payload.type,

      title:
        payload.title,

      description:
        payload.description,

      entityType:
        payload.entityType,

      entityId:
        payload.entityId,

      userName:
        payload.userName,

      userEmail:
        payload.userEmail,

      user:
        payload.user,

      companyId:
        payload.companyId,

      departmentId:
        payload.departmentId,

      company:
        payload.company,

      department:
        payload.department,

      metadata:
        payload.metadata,
    })
    .catch(
      (error) => {
        console.error(
          "Aktivität konnte nicht gespeichert werden:",
          error
        );
      }
    );
}

export function saveCompanyCreatedActivity(
  company: Company
) {
  createOrganizationActivity({
    type:
      "created",

    title:
      "Firma erstellt",

    description:
      `Firma "${company.name}" wurde erstellt.`,

    entityType:
      "company",

    entityId:
      company.id,

    userName:
      "System",

    userEmail:
      "",

    user:
      "System",

    companyId:
      company.id,

    departmentId:
      "",

    company:
      company.name,

    department:
      "",

    metadata: {
      companyId:
        company.id,

      companyName:
        company.name,

      status:
        company.status,
    },
  });
}

export function saveCompanyUpdatedActivity(
  company: Company
) {
  createOrganizationActivity({
    type:
      "edited",

    title:
      "Firma bearbeitet",

    description:
      `Firma "${company.name}" wurde bearbeitet.`,

    entityType:
      "company",

    entityId:
      company.id,

    userName:
      "System",

    userEmail:
      "",

    user:
      "System",

    companyId:
      company.id,

    departmentId:
      "",

    company:
      company.name,

    department:
      "",

    metadata: {
      companyId:
        company.id,

      companyName:
        company.name,

      status:
        company.status,
    },
  });
}

export function saveCompanyDeletedActivity(
  company: Company
) {
  createOrganizationActivity({
    type:
      "deleted",

    title:
      "Firma gelöscht",

    description:
      `Firma "${company.name}" wurde gelöscht.`,

    entityType:
      "company",

    entityId:
      company.id,

    userName:
      "System",

    userEmail:
      "",

    user:
      "System",

    companyId:
      company.id,

    departmentId:
      "",

    company:
      company.name,

    department:
      "",

    metadata: {
      companyId:
        company.id,

      companyName:
        company.name,

      status:
        company.status,
    },
  });
}

export function saveDepartmentCreatedActivity(
  department: Department,
  companyName = "Intern"
) {
  createOrganizationActivity({
    type:
      "created",

    title:
      "Abteilung erstellt",

    description:
      `Abteilung "${department.name}" wurde erstellt.`,

    entityType:
      "department",

    entityId:
      department.id,

    userName:
      "System",

    userEmail:
      "",

    user:
      "System",

    companyId:
      department.companyId,

    departmentId:
      department.id,

    company:
      companyName,

    department:
      department.name,

    metadata: {
      departmentId:
        department.id,

      departmentName:
        department.name,

      companyId:
        department.companyId,

      companyName,

      status:
        department.status,
    },
  });
}

export function saveDepartmentUpdatedActivity(
  department: Department,
  companyName = "Intern"
) {
  createOrganizationActivity({
    type:
      "edited",

    title:
      "Abteilung bearbeitet",

    description:
      `Abteilung "${department.name}" wurde bearbeitet.`,

    entityType:
      "department",

    entityId:
      department.id,

    userName:
      "System",

    userEmail:
      "",

    user:
      "System",

    companyId:
      department.companyId,

    departmentId:
      department.id,

    company:
      companyName,

    department:
      department.name,

    metadata: {
      departmentId:
        department.id,

      departmentName:
        department.name,

      companyId:
        department.companyId,

      companyName,

      status:
        department.status,
    },
  });
}

export function saveDepartmentDeletedActivity(
  department: Department,
  companyName = "Intern"
) {
  createOrganizationActivity({
    type:
      "deleted",

    title:
      "Abteilung gelöscht",

    description:
      `Abteilung "${department.name}" wurde gelöscht.`,

    entityType:
      "department",

    entityId:
      department.id,

    userName:
      "System",

    userEmail:
      "",

    user:
      "System",

    companyId:
      department.companyId,

    departmentId:
      department.id,

    company:
      companyName,

    department:
      department.name,

    metadata: {
      departmentId:
        department.id,

      departmentName:
        department.name,

      companyId:
        department.companyId,

      companyName,

      status:
        department.status,
    },
  });
}
