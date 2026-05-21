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
  description: string;
  status: CompanyStatus;
  createdAt: string;
  updatedAt: string;
};

export type Department = {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  description: string;
  status: DepartmentStatus;
  createdAt: string;
  updatedAt: string;
};

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