"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import {
  areDemoHintsEnabled,
} from "../lib/featureFlags";

type DemoHintProps = {
  title?: string;
  children: ReactNode;
};

export default function DemoHint({
  title = "Demo-Hinweis",
  children,
}: DemoHintProps) {
  const [mounted, setMounted] =
    useState(false);

  const [enabled, setEnabled] =
    useState(true);

  useEffect(() => {
    setMounted(true);

    setEnabled(
      areDemoHintsEnabled()
    );

    function handleSettingsUpdated() {
      setEnabled(
        areDemoHintsEnabled()
      );
    }

    window.addEventListener(
      "appSettingsUpdated",
      handleSettingsUpdated
    );

    return () => {
      window.removeEventListener(
        "appSettingsUpdated",
        handleSettingsUpdated
      );
    };
  }, []);

  if (!mounted) {
    return null;
  }

  if (!enabled) {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-3xl p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center text-xl shrink-0">
          💡
        </div>

        <div className="min-w-0">
          <h2 className="font-semibold">
            {title}
          </h2>

          <div className="text-sm mt-2 leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}