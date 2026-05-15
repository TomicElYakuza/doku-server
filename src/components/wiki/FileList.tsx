"use client";

import { useEffect, useState } from "react";

import {
  getFiles,
  deleteFile,
} from "../../lib/fileStorage";

export default function FileList({
  slug,
  editable = false,
}: {
  slug: string;

  editable?: boolean;
}) {
  const [files, setFiles] =
    useState<any[]>([]);

  function loadFiles() {
    const allFiles =
      getFiles();

    setFiles(
      allFiles[slug] || []
    );
  }

  useEffect(() => {
    loadFiles();

    window.addEventListener(
      "filesUpdated",
      loadFiles
    );

    return () => {
      window.removeEventListener(
        "filesUpdated",
        loadFiles
      );
    };
  }, [slug]);

  function handleDelete(
    index: number
  ) {
    const confirmed = confirm(
      "Datei wirklich löschen?"
    );

    if (!confirmed) {
      return;
    }

    deleteFile(slug, index);

    loadFiles();

    window.dispatchEvent(
      new Event("filesUpdated")
    );
  }

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6">
        Anhänge
      </h2>

      <div className="space-y-3">
        {files.map(
          (
            file: any,
            index: number
          ) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border border-zinc-200 rounded-2xl hover:bg-zinc-50 transition"
            >
              {/* FILE INFO */}
              <a
                href={file.data}
                download={file.name}
                className="flex-1"
              >
                <p className="font-medium">
                  {file.name}
                </p>

                <p className="text-sm text-zinc-500 mt-1">
                  {Math.round(
                    file.size / 1024
                  )}{" "}
                  KB
                </p>
              </a>

              {/* ACTIONS */}
              <div className="flex items-center gap-4 ml-6">
                <p className="text-sm text-zinc-500">
                  {file.uploadedAt}
                </p>

                {editable && (
                  <button
                    onClick={() =>
                      handleDelete(
                        index
                      )
                    }
                    className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition"
                  >
                    Löschen
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}