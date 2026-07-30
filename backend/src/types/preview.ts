export interface PreviewResult {
  fileName: string;
  fileType: string;
  fileSize: number;
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  columnCount: number;
}