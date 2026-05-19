export type DataEntity =
  | "wikiPage"
  | "ticket"
  | "ticketComment"
  | "ticketTemplate"
  | "activity"
  | "adminUser"
  | "company"
  | "department"
  | "settings"
  | "currentUser"
  | "notification";

export type DataAdapterMode =
  | "localStorage"
  | "api"
  | "database";

export type DataAdapterResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type DataAdapterListResult<T> = {
  success: boolean;
  data: T[];
  error?: string;
};

export type DataAdapterQuery = {
  search?: string;
  companyId?: string;
  departmentId?: string;
  status?: string;
  role?: string;
  type?: string;
  entityId?: string;
  entityType?: string;
  limit?: number;
  offset?: number;
};

export type DataAdapterMeta = {
  mode: DataAdapterMode;
  entity: DataEntity;
  source: string;
  supportsCreate: boolean;
  supportsUpdate: boolean;
  supportsDelete: boolean;
  supportsSearch: boolean;
};

export type DataAdapter<T> = {
  meta: DataAdapterMeta;

  list: (
    query?: DataAdapterQuery
  ) => Promise<DataAdapterListResult<T>>;

  getById: (
    id: string
  ) => Promise<DataAdapterResult<T | null>>;

  create: (
    data: Omit<T, "id" | "createdAt" | "updatedAt">
  ) => Promise<DataAdapterResult<T>>;

  update: (
    id: string,
    data: Partial<T>
  ) => Promise<DataAdapterResult<T | null>>;

  delete: (
    id: string
  ) => Promise<DataAdapterResult<boolean>>;
};

export function createSuccessResult<T>(
  data: T
): DataAdapterResult<T> {
  return {
    success: true,
    data,
  };
}

export function createErrorResult<T>(
  error: string
): DataAdapterResult<T> {
  return {
    success: false,
    error,
  };
}

export function createSuccessListResult<T>(
  data: T[]
): DataAdapterListResult<T> {
  return {
    success: true,
    data,
  };
}

export function createErrorListResult<T>(
  error: string
): DataAdapterListResult<T> {
  return {
    success: false,
    data: [],
    error,
  };
}

export function createLocalStorageAdapterMeta(
  entity: DataEntity,
  source: string
): DataAdapterMeta {
  return {
    mode:
      "localStorage",

    entity,

    source,

    supportsCreate:
      true,

    supportsUpdate:
      true,

    supportsDelete:
      true,

    supportsSearch:
      true,
  };
}

export function createApiAdapterMeta(
  entity: DataEntity,
  source: string
): DataAdapterMeta {
  return {
    mode:
      "api",

    entity,

    source,

    supportsCreate:
      true,

    supportsUpdate:
      true,

    supportsDelete:
      true,

    supportsSearch:
      true,
  };
}

export function createDatabaseAdapterMeta(
  entity: DataEntity,
  source: string
): DataAdapterMeta {
  return {
    mode:
      "database",

    entity,

    source,

    supportsCreate:
      true,

    supportsUpdate:
      true,

    supportsDelete:
      true,

    supportsSearch:
      true,
  };
}

export function createNotImplementedAdapter<T>(
  entity: DataEntity,
  source = "not-implemented"
): DataAdapter<T> {
  return {
    meta:
      {
        mode:
          "api",

        entity,

        source,

        supportsCreate:
          false,

        supportsUpdate:
          false,

        supportsDelete:
          false,

        supportsSearch:
          false,
      },

    async list() {
      return createErrorListResult<T>(
        "Dieser Adapter ist noch nicht implementiert."
      );
    },

    async getById() {
      return createErrorResult<T | null>(
        "Dieser Adapter ist noch nicht implementiert."
      );
    },

    async create() {
      return createErrorResult<T>(
        "Dieser Adapter ist noch nicht implementiert."
      );
    },

    async update() {
      return createErrorResult<T | null>(
        "Dieser Adapter ist noch nicht implementiert."
      );
    },

    async delete() {
      return createErrorResult<boolean>(
        "Dieser Adapter ist noch nicht implementiert."
      );
    },
  };
}

export function matchesSearchQuery(
  values: Array<string | undefined | null>,
  search?: string
) {
  if (!search) {
    return true;
  }

  const query =
    search
      .trim()
      .toLowerCase();

  if (!query) {
    return true;
  }

  return values.some(
    (value) =>
      String(value || "")
        .toLowerCase()
        .includes(query)
  );
}

export function applyPagination<T>(
  items: T[],
  query?: DataAdapterQuery
) {
  const offset =
    query?.offset || 0;

  const limit =
    query?.limit || items.length;

  return items.slice(
    offset,
    offset + limit
  );
}