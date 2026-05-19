"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  listData,
} from "../lib/dataService";

import {
  getEventsForDataEntity,
} from "../lib/dataEntityEvents";

import type {
  DataAdapterQuery,
  DataEntity,
} from "../lib/dataAdapter";

import type {
  AppEventName,
} from "../lib/appEvents";

export type UseDataListState<T> = {
  data: T[];
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
};

export function useDataList<T>(
  entity: DataEntity,
  query?: DataAdapterQuery,
  events?: AppEventName[]
): UseDataListState<T> {
  const [data, setData] =
    useState<T[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const queryKey =
    useMemo(
      () =>
        JSON.stringify(
          query || {}
        ),
      [
        query,
      ]
    );

  const effectiveEvents =
    useMemo(
      () =>
        events && events.length > 0
          ? events
          : getEventsForDataEntity(
              entity
            ),
      [
        entity,
        events?.join("|"),
      ]
    );

  const eventsKey =
    useMemo(
      () =>
        effectiveEvents.join("|"),
      [
        effectiveEvents,
      ]
    );

  const reload =
    useCallback(
      async () => {
        setLoading(
          true
        );

        setError(
          ""
        );

        const result =
          await listData<T>(
            entity,
            query
          );

        if (!result.success) {
          setData(
            []
          );

          setError(
            result.error ||
              "Daten konnten nicht geladen werden."
          );

          setLoading(
            false
          );

          return;
        }

        setData(
          result.data
        );

        setLoading(
          false
        );
      },
      [
        entity,
        queryKey,
      ]
    );

  useEffect(() => {
    reload();
  }, [
    reload,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    function handleUpdate() {
      reload();
    }

    effectiveEvents.forEach(
      (eventName) => {
        window.addEventListener(
          eventName,
          handleUpdate
        );
      }
    );

    return () => {
      effectiveEvents.forEach(
        (eventName) => {
          window.removeEventListener(
            eventName,
            handleUpdate
          );
        }
      );
    };
  }, [
    reload,
    eventsKey,
  ]);

  return {
    data,
    loading,
    error,
    reload,
  };
}