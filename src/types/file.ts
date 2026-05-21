export type StoredFile = {
  name: string;
  type: string;
  size: number;
  data: string;
  uploadedAt: string;
  uploadedBy: string;
};

export type FileMap = Record<
  string,
  StoredFile[]
>;

export type FileSearchResult = {
  key: string;
  index: number;
  file: StoredFile;
};