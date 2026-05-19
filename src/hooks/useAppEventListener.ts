"use client";

import {
  useEffect,
} from "react";

import {
  addMultipleAppEventListeners,
} from "../lib/appEvents";

import type {
  AppEventName,
} from "../lib/appEvents";

export function useAppEventListener(
  eventNames: AppEventName[],
  handler: () => void
) {
  useEffect(() => {
    function handleEvent() {
      handler();
    }

    const removeListeners =
      addMultipleAppEventListeners(
        eventNames,
        handleEvent
      );

    return () => {
      removeListeners();
    };
  }, [
    eventNames.join("|"),
    handler,
  ]);
}