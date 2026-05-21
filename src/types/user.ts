export type {
  AdminUser,
  AdminUserStatus,
} from "../lib/adminUserStorage";

export type {
  User,
  UserRole,
} from "../lib/userStorage";

export type AdminUserCreateInput = Omit<
  import("../lib/adminUserStorage").AdminUser,
  "id" | "createdAt" | "updatedAt"
>;

export type AdminUserUpdateInput =
  Partial<
    Omit<
      import("../lib/adminUserStorage").AdminUser,
      "id" | "createdAt" | "updatedAt"
    >
  >;