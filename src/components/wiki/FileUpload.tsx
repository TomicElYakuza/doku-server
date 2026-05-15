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

    if (!slug) {
      alert(
        "Dateien können erst hochgeladen werden, wenn ein gültiger Slug vorhanden ist."
      );

      return;
    }

    setUploading(true);

    const filesArray =
      Array.from(selectedFiles);

    let finishedFiles = 0;

    filesArray.forEach((file) => {
      const reader =
        new FileReader();

      reader.onload = () => {
        const currentUser =
          getUser();

        const newFile = {
          name:
            file.name,

          type:
            file.type,

          size:
            file.size,

          data:
            reader.result,

          uploadedAt:
            new Date().toLocaleString(),

          uploadedBy:
            currentUser?.name ||
            "Unbekannt",
        };

        saveFile(
          slug,
          newFile
        );

        saveActivity({
          type: "uploaded",

          title:
            file.name,

          user:
            currentUser?.name ||
            "Unbekannt",

          createdAt:
            new Date().toLocaleString(),
        });

        finishedFiles += 1;

        if (
          finishedFiles ===
          filesArray.length
        ) {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        finishedFiles += 1;

        if (
          finishedFiles ===
          filesArray.length
        ) {
          setUploading(false);
        }
      };

      reader.readAsDataURL(file);
    });

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

      <label className={`inline-flex mt-4 border border-zinc-200 px-5 py-3 rounded-2xl transition cursor-pointer ${
        uploading
          ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
          : "bg-white hover:bg-zinc-100"
      }`}>
        {uploading
          ? "Wird hochgeladen..."
          : "Dateien auswählen"}

        <input
          type="file"
          multiple
          disabled={uploading}
          onChange={handleFileUpload}
          className="hidden"
        />
      </label>
    </div>
  );
}