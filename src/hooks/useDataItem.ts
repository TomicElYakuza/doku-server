"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getDataById,
} from "../lib/dataService";

import {
  getEventsForDataEntity,
} from "../lib/dataEntityEvents";

import type {
  DataEntity,
} from "../lib/dataAdapter";

import type {
  AppEventName,
} from "../lib/appEvents";

export type UseDataItemState<T> = {
  data: T | null;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
};

export function useDataItem<T>(
  entity: DataEntity,
  id: string,
  events?: AppEventName[]
): UseDataItemState<T> {
  const [data, setData] =
    useState<T | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

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
        if (!id) {
          setData(
            null
          );

          setLoading(
            false
          );

          setError(
            "Keine ID angegeben."
          );

          return;
        }

        setLoading(
          true
        );

        setError(
          ""
        );

        const result =
          await getDataById<T>(
            entity,
            id
          );

        if (!result.success) {
          setData(
            null
          );

          setError(
            result.error ||
              "Datensatz konnte nicht geladen werden."
          );

          setLoading(
            false
          );

          return;
        }

        setData(
          result.data || null
        );

        setLoading(
          false
        );
      },
      [
        entity,
        id,
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