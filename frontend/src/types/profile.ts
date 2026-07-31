export interface DatasetProfile {
  dataset: {
    id: string;
    name: string;
    filename: string;
    size: number;
    uploadedAt: string;
  };

  profile: {
    rows: number;
    columns: number;

    quality: {
      score: number;
    };

    numericColumns: string[];

    categoricalColumns: string[];

    dateColumns: string[];

    duplicateRows: number;

    missingValues: Record<
      string,
      number
    >;

    recommendedCharts: string[];

    statistics: Record<
      string,
      unknown
    >;
  };

  visualizations: {
    barChart?: {
      labels: string[];
      values: number[];
    };

    pieChart?: {
      labels: string[];
      values: number[];
    };

    lineChart?: {
      labels: string[];
      values: number[];
    };
  };
}
