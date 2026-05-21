export type {
  Company,
  CompanyStatus,
  Department,
  DepartmentStatus,
} from "../lib/companyStorage";

export type CompanyCreateInput = Omit<
  import("../lib/companyStorage").Company,
  "id" | "createdAt" | "updatedAt"
>;

export type CompanyUpdateInput =
  Partial<
    Omit<
      import("../lib/companyStorage").Company,
      "id" | "createdAt" | "updatedAt"
    >
  >;

export type DepartmentCreateInput = Omit<
  import("../lib/companyStorage").Department,
  "id" | "createdAt" | "updatedAt"
>;

export type DepartmentUpdateInput =
  Partial<
    Omit<
      import("../lib/companyStorage").Department,
      "id" | "createdAt" | "updatedAt"
    >
  >;