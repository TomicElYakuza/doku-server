"use client";

import {
  ChangeEvent,
  useState,
} from "react";

import {
  fileRepository,
} from "../../lib/fileRepository";

import {
  activityRepository,
} from "../../lib/activityRepository";

type FileUploadProps = {
  pageSlug: string;
  onUploaded?: () => void;
};

function getWikiFileKey(
  pageSlug: string
) {
  return `wiki-${pageSlug}`;
}

function readFileAsDataUrl(
  file: File
): Promise<string> {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload =
        () => {
          resolve(
            String(
              reader.result ||
                ""
            )
          );
        };

      reader.onerror =
        () => {
          reject(
            new Error(
              "Datei konnte nicht gelesen werden."
            )
          );
        };

      reader.readAsDataURL(
        file
      );
    }
  );
}

export default function FileUpload({
  pageSlug,
  onUploaded,
}: FileUploadProps) {
  const [uploading, setUploading] =
    useState(false);

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles =
      Array.from(
        event.target.files ||
          []
      );

    if (selectedFiles.length === 0) {
      return;
    }

    try {
      setUploading(
        true
      );

      for (const file of selectedFiles) {
        const data =
          await readFileAsDataUrl(
            file
          );

        await fileRepository.addToKey(
          getWikiFileKey(
            pageSlug
          ),
          {
            name:
              file.name,

            type:
              file.type ||
              "application/octet-stream",

            size:
              file.size,

            data,

            uploadedAt:
              new Date().toLocaleString(),

            uploadedBy:
              "System",
          }
        );

        void activityRepository.create({
          type:
            "created",

          title:
            "Wiki-Datei hochgeladen",

          description:
            `Datei "${file.name}" wurde zu Wiki-Seite "${pageSlug}" hochgeladen.`,

          entityType:
            "wiki",

          entityId:
            pageSlug,

          userName:
            "System",

          userEmail:
            "",

          user:
            "System",

          companyId:
            "",

          departmentId:
            "",

          company:
            "Intern",

          department:
            "Allgemein",

          metadata: {
            pageSlug,
            fileName:
              file.name,
            fileSize:
              file.size,
          },
        });
      }

      onUploaded?.();

      event.target.value =
        "";
    } catch (error) {
      console.error(
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Datei konnte nicht hochgeladen werden."
      );
    } finally {
      setUploading(
        false
      );
    }
  }

  return (
    <div className="border border-dashed border-zinc-300 rounded-2xl p-5 bg-zinc-50">
      <label className="block">
        <span className="block font-medium">
          Dateien hochladen
        </span>

        <span className="block text-sm text-zinc-500 mt-1">
          Dateien werden in PostgreSQL gespeichert.
        </span>

        <input
          type="file"
          multiple
          onChange={(event) =>
            void handleFileChange(
              event
            )
          }
          disabled={uploading}
          className="mt-4 block w-full text-sm"
        />
      </label>

      {uploading && (
        <p className="text-sm text-zinc-500 mt-3">
          Upload läuft...
        </p>
      )}
    </div>
  );
}