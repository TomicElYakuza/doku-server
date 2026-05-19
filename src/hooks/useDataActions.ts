"use client";

import {
  useState,
} from "react";

import {
  createData,
  deleteData,
  updateData,
} from "../lib/dataService";

import type {
  DataEntity,
} from "../lib/dataAdapter";

export type UseDataActionsState = {
  loading: boolean;
  error: string;
  createItem: <T>(
    entity: DataEntity,
    data: Omit<T, "id" | "createdAt" | "updatedAt">
  ) => Promise<T | null>;
  updateItem: <T>(
    entity: DataEntity,
    id: string,
    data: Partial<T>
  ) => Promise<T | null>;
  deleteItem: <T>(
    entity: DataEntity,
    id: string
  ) => Promise<boolean>;
  clearError: () => void;
};

export function useDataActions(): UseDataActionsState {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  function clearError() {
    setError("");
  }

  async function createItem<T>(
    entity: DataEntity,
    data: Omit<T, "id" | "createdAt" | "updatedAt">
  ) {
    setLoading(true);

    setError("");

    const result =
      await createData<T>(
        entity,
        data
      );

    setLoading(false);

    if (!result.success) {
      setError(
        result.error ||
          "Datensatz konnte nicht erstellt werden."
      );

      return null;
    }

    return result.data || null;
  }

  async function updateItem<T>(
    entity: DataEntity,
    id: string,
    data: Partial<T>
  ) {
    setLoading(true);

    setError("");

    const result =
      await updateData<T>(
        entity,
        id,
        data
      );

    setLoading(false);

    if (!result.success) {
      setError(
        result.error ||
          "Datensatz konnte nicht aktualisiert werden."
      );

      return null;
    }

    return result.data || null;
  }

  async function deleteItem<T>(
    entity: DataEntity,
    id: string
  ) {
    setLoading(true);

    setError("");

    const result =
      await deleteData<T>(
        entity,
        id
      );

    setLoading(false);

    if (!result.success) {
      setError(
        result.error ||
          "Datensatz konnte nicht gelöscht werden."
      );

      return false;
    }

    return Boolean(
      result.data
    );
  }

  return {
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    clearError,
  };
}