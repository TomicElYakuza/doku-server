"use client";

import {
  useEffect,
  useState,
} from "react";

type NotificationCenterProps = {
  message?: string;
};

export default function NotificationCenter({
  message = "System läuft mit PostgreSQL.",
}: NotificationCenterProps) {
  const [visible, setVisible] =
    useState(false);

  useEffect(() => {
    setVisible(
      true
    );
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-white border border-zinc-200 rounded-3xl p-5 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-2xl bg-green-50 text-green-700 flex items-center justify-center shrink-0">
          ✓
        </div>

        <div className="min-w-0">
          <p className="font-semibold">
            Hinweis
          </p>

          <p className="text-sm text-zinc-500 mt-1">
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setVisible(
              false
            )
          }
          className="text-zinc-400 hover:text-zinc-700 transition"
          aria-label="Benachrichtigung schließen"
        >
          ×
        </button>
      </div>
    </div>
  );
}