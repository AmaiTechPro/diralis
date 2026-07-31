export interface ColumnProfile {
  name: string;
  type: "number" | "string" | "boolean" | "date";
  missing: number;
  unique: number;
}


export interface NumericStatistics {
  min: number;
  max: number;
  mean: number;
  median: number;
  standardDeviation: number;
}

export interface CorrelationResult {
  columnA: string;
  columnB: string;
  coefficient: number;
}


export interface DataQualityReport {

  score: number;

  issues: string[];

}


export interface DatasetProfile {

  rows: number;

  columns: number;

  columnProfiles: ColumnProfile[];

  numericColumns: string[];

  categoricalColumns: string[];

  dateColumns: string[];

  missingValues: Record<string, number>;

  duplicateRows: number;

  statistics: Record<string, NumericStatistics>;

  correlations: CorrelationResult[];

  recommendedCharts: string[];

  quality: DataQualityReport;

}
