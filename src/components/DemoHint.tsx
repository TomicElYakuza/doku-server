"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useAppSettings,
} from "../hooks/useAppSettings";

type DemoHintProps = {
  title?: string;
  description?: string;
  className?: string;
};

export default function DemoHint({
  title = "Hinweis",
  description = "Diese Anwendung läuft jetzt mit PostgreSQL.",
  className = "",
}: DemoHintProps) {
  const [mounted, setMounted] =
    useState(false);

  const {
    settings,
    loading,
  } =
    useAppSettings();

  useEffect(() => {
    setMounted(
      true
    );
  }, []);

  if (!mounted) {
    return null;
  }

  if (loading) {
    return null;
  }

  if (!settings.showDemoHints) {
    return null;
  }

  return (
    <div className={`bg-blue-50 border border-blue-100 text-blue-800 rounded-3xl p-5 ${className}`}>
      <p className="font-semibold">
        {title}
      </p>

      <p className="text-sm mt-2 leading-relaxed">
        {description}
      </p>
    </div>
  );
}