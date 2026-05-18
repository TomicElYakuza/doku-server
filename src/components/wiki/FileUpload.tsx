"use client";

import {
  useState,
} from "react";

import {
  saveFile,
} from "../../lib/fileStorage";

import {
  saveActivity,
} from "../../lib/activityStorage";

import {
  getUser,
} from "../../lib/userStorage";

import {
  getStoredPages,
} from "../../lib/wikiStorage";

type FileUploadProps = {
  slug: string;
};

export default function FileUpload({
  slug,
}: FileUploadProps) {
  const [uploading, setUploading] =
    useState(false);

  function getCurrentCompany() {
    const pages =
      getStoredPages();

    const page =
      pages.find(
        (item: any) =>
          item.slug === slug
      );

    return (
      page?.company ||
      "Intern"
    );
  }

  function handleFileUpload(
    event: any
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!slug) {
      alert(
        "Es wurde kein Dokument-Slug gefunden."
      );

      return;
    }

    setUploading(true);

    const reader =
      new FileReader();

    reader.onload = () => {
      const user =
        getUser();

      const company =
        getCurrentCompany();

      saveFile(slug, {
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
          user?.name ||
          "Unbekannt",
      });

      saveActivity({
        type: "uploaded",

        title:
          file.name,

        company,

        user:
          user?.name ||
          "Unbekannt",

        createdAt:
          new Date().toLocaleString(),
      });

      setUploading(false);

      event.target.value = "";
    };

    reader.onerror = () => {
      setUploading(false);

      alert(
        "Datei konnte nicht gelesen werden."
      );
    };

    reader.readAsDataURL(file);
  }

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
      <h3 className="font-semibold">
        Anhänge
      </h3>

      <p className="text-sm text-zinc-500 mt-2">
        Lade Dateien hoch, die zu diesem Dokument gehören.
      </p>

      <label className="inline-flex mt-5 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition cursor-pointer">
        {uploading
          ? "Wird hochgeladen..."
          : "Datei hochladen"}

        <input
          type="file"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
    </div>
  );
}