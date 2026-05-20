import {
  saveFile,
} from "./fileStorage";

import {
  saveActivity,
} from "./activityStorage";

import {
  getUser,
} from "./userStorage";

export type PendingNewsFile = {
  name: string;
  type: string;
  size: number;
  data: string;
  uploadedAt: string;
  uploadedBy: string;
};

function getStorageKey(
  newsId: string
) {
  return `news-${newsId}`;
}

export function readNewsFile(
  file: File
): Promise<PendingNewsFile> {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = () => {
        resolve({
          name:
            file.name,

          type:
            file.type,

          size:
            file.size,

          data:
            String(
              reader.result || ""
            ),

          uploadedAt:
            new Date().toLocaleString(),

          uploadedBy:
            getUser()?.name ||
            "Unbekannt",
        });
      };

      reader.onerror = () => {
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

export async function readNewsFiles(
  fileList: FileList | null
): Promise<PendingNewsFile[]> {
  if (!fileList) {
    return [];
  }

  const files =
    Array.from(
      fileList
    );

  return Promise.all(
    files.map(
      (file) =>
        readNewsFile(
          file
        )
    )
  );
}

export function saveNewsFiles(
  newsId: string,
  files: PendingNewsFile[]
) {
  files.forEach(
    (file) => {
      saveFile(
        getStorageKey(
          newsId
        ),
        file
      );

      saveActivity({
        type:
          "fileUploaded",

        title:
          file.name ||
          "News-Anhang hochgeladen",

        company:
          "News",

        user:
          getUser()?.name ||
          "Unbekannt",

        createdAt:
          new Date().toLocaleString(),
      });
    }
  );
}