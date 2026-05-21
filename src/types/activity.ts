export type ActivityType =
  | "created"
  | "edited"
  | "deleted"
  | "restored"
  | "deletedForever"
  | "login"
  | "logout"
  | "system"
  | string;

export type ActivityMetadata =
  Record<
    string,
    string | number | boolean | null
  >;

export type Activity = {
  id: string;
  type: ActivityType;
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
  metadata: ActivityMetadata;
  createdAt: string;
};

export type ActivityInput = Omit<
  Activity,
  "id" | "createdAt"
>;

export type ActivityCreateInput =
  ActivityInput;