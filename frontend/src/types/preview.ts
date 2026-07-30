export interface PreviewResult {
  fileName: string;
  fileType: string;
  fileSize: number;

  rowCount: number;
  columnCount: number;

  columns: string[];

  rows: Record<
    string,
    unknown
  >[];
}

