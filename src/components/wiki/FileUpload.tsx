"use client";

import { useState } from "react";

import {
  saveFile,
} from "../../lib/fileStorage";

import {
  saveActivity,
} from "../../lib/activityStorage";

import {
  getUser,
} from "../../lib/userStorage";

export default function FileUpload({
  slug,
}: {
  slug: string;
}) {
  const [uploading, setUploading] =
    useState(false);

  function handleFileUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles =
      event.target.files;

    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    setUploading(true);

    Array.from(selectedFiles).forEach(
      (file) => {
        const reader =
          new FileReader();

        reader.onload = () => {
          const newFile = {
            name: file.name,

            type: file.type,

            size: file.size,

            data: reader.result,

            uploadedAt:
              new Date().toLocaleString(),

            uploadedBy:
              getUser()?.name ||
              "Unbekannt",
          };

          saveFile(slug, newFile);

          saveActivity({
            type: "uploaded",

            title: file.name,

            user:
              getUser()?.name ||
              "Unbekannt",

            createdAt:
              new Date().toLocaleString(),
          });

          window.dispatchEvent(
            new Event("activityUpdated")
          );
        };

        reader.readAsDataURL(file);
      }
    );

    setUploading(false);

    event.target.value = "";
  }

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
      <h3 className="font-semibold">
        Anhänge hochladen
      </h3>

      <p className="text-sm text-zinc-500 mt-2">
        Dateien werden lokal im Browser gespeichert.
      </p>

      <label className="inline-flex mt-4 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition cursor-pointer">
        {uploading
          ? "Wird hochgeladen..."
          : "Dateien auswählen"}

        <input
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
      </label>
    </div>
  );
}