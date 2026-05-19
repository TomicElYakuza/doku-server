import {
  saveFile,
} from "./fileStorage";

import {
  saveActivity,
} from "./activityStorage";

import {
  getUser,
} from "./userStorage";

export type PendingTicketFile = {
  name: string;
  type: string;
  size: number;
  data: string;
  uploadedAt: string;
  uploadedBy: string;
};

export function readTicketFile(
  file: File
): Promise<PendingTicketFile> {
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

export async function readTicketFiles(
  fileList: FileList | null
): Promise<PendingTicketFile[]> {
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
        readTicketFile(
          file
        )
    )
  );
}

export function saveTicketFiles(
  ticketId: string,
  files: PendingTicketFile[]
) {
  files.forEach(
    (file) => {
      saveFile(
        ticketId,
        file
      );

      saveActivity({
        type:
          "fileUploaded",

        title:
          file.name ||
          "Ticket-Datei hochgeladen",

        company:
          "Tickets",

        user:
          getUser()?.name ||
          "Unbekannt",

        createdAt:
          new Date().toLocaleString(),
      });
    }
  );
}