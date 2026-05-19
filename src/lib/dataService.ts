import {
  getDataAdapter,
} from "./dataAdapterRegistry";

import type {
  DataAdapterQuery,
  DataEntity,
} from "./dataAdapter";

import {
  dispatchDataUpdated,
} from "./appEvents";

export async function listData<T>(
  entity: DataEntity,
  query?: DataAdapterQuery
) {
  const adapter =
    getDataAdapter<T>(
      entity
    );

  return adapter.list(
    query
  );
}

export async function getDataById<T>(
  entity: DataEntity,
  id: string
) {
  const adapter =
    getDataAdapter<T>(
      entity
    );

  return adapter.getById(
    id
  );
}

export async function createData<T>(
  entity: DataEntity,
  data: Omit<T, "id" | "createdAt" | "updatedAt">
) {
  const adapter =
    getDataAdapter<T>(
      entity
    );

  const result =
    await adapter.create(
      data
    );

  if (result.success) {
    dispatchDataUpdated();
  }

  return result;
}

export async function updateData<T>(
  entity: DataEntity,
  id: string,
  data: Partial<T>
) {
  const adapter =
    getDataAdapter<T>(
      entity
    );

  const result =
    await adapter.update(
      id,
      data
    );

  if (result.success) {
    dispatchDataUpdated();
  }

  return result;
}

export async function deleteData<T>(
  entity: DataEntity,
  id: string
) {
  const adapter =
    getDataAdapter<T>(
      entity
    );

  const result =
    await adapter.delete(
      id
    );

  if (result.success) {
    dispatchDataUpdated();
  }

  return result;
}

export async function searchData<T>(
  entity: DataEntity,
  search: string,
  query?: Omit<DataAdapterQuery, "search">
) {
  return listData<T>(
    entity,
    {
      ...query,

      search,
    }
  );
}

export async function listDataByCompany<T>(
  entity: DataEntity,
  companyId: string,
  query?: Omit<DataAdapterQuery, "companyId">
) {
  return listData<T>(
    entity,
    {
      ...query,

      companyId,
    }
  );
}

export async function listDataByDepartment<T>(
  entity: DataEntity,
  departmentId: string,
  query?: Omit<DataAdapterQuery, "departmentId">
) {
  return listData<T>(
    entity,
    {
      ...query,

      departmentId,
    }
  );
}

export async function listDataByStatus<T>(
  entity: DataEntity,
  status: string,
  query?: Omit<DataAdapterQuery, "status">
) {
  return listData<T>(
    entity,
    {
      ...query,

      status,
    }
  );
}

export async function listDataByEntity<T>(
  entity: DataEntity,
  entityType: string,
  entityId: string,
  query?: Omit<DataAdapterQuery, "entityType" | "entityId">
) {
  return listData<T>(
    entity,
    {
      ...query,

      entityType,

      entityId,
    }
  );
}