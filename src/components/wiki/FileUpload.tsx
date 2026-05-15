"use client";

import { useState } from "react";

import {
  saveFile,
} from "../../lib/fileStorage";

export default function FileUpload({
  slug,
}: {
  slug: string;
}) {
  const [uploading, setUploading] =
    useState(false);

  async function handleUpload(
    e: any
  ) {
    const files =
      Array.from(
        e.target.files
      ) as File[];

    setUploading(true);

    for (const file of files) {
      const reader =
        new FileReader();

      reader.onload = () => {
        saveFile(slug, {
          name: file.name,

          type: file.type,

          size: file.size,

          uploadedAt:
            new Date().toLocaleString(),

          data:
            reader.result,
        });

        window.dispatchEvent(
          new Event(
            "filesUpdated"
          )
        );
      };

      reader.readAsDataURL(file);
    }

    setUploading(false);
  }

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">
        Dateien hochladen
      </h3>

      <input
        type="file"
        multiple
        onChange={handleUpload}
        className="w-full border border-zinc-200 rounded-xl px-4 py-3 bg-white"
      />

      {uploading && (
        <p className="text-sm text-zinc-500 mt-3">
          Upload läuft...
        </p>
      )}
    </div>
  );
}