export interface DatasetInsights {
  summary: string;

  quality: string[];

  statistics: string[];

  anomalies: string[];

  business: string[];

  forecast: string[];

  kpis: string[];

  rootCauses: string[];
}


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


  insights: DatasetInsights;


  visualizations: {

    barChart?: {
      title: string;
      labels: string[];
      values: number[];
    };


    pieChart?: {
      title: string;
      labels: string[];
      values: number[];
    };


    lineChart?: {
      title: string;
      labels: string[];
      values: number[];
    };

  };

}

