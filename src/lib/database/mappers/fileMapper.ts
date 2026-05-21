import type {
  StoredFile,
} from "../../../types/file";

export type FileRow = {
  id: string;
  storage_key: string;
  name: string;
  type: string | null;
  size: number | null;
  data: string;
  uploaded_by: string | null;
  uploaded_at: string;
};

export type StoredFileWithId =
  StoredFile & {
    id: string;
    key: string;
  };

export function mapFileRow(
  row: FileRow
): StoredFileWithId {
  return {
    id:
      row.id,

    key:
      row.storage_key,

    name:
      row.name,

    type:
      row.type ||
      "application/octet-stream",

    size:
      row.size ||
      0,

    data:
      row.data,

    uploadedBy:
      row.uploaded_by ||
      "Unbekannt",

    uploadedAt:
      new Date(
        row.uploaded_at
      ).toLocaleString(),
  };
}