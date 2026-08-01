import { profileDataset } from "../profiler/profileDataset";
import { generateInsights } from "../insights/generateInsights";



export async function buildReportData(
  dataset: any
) {


  const profile =
    await profileDataset(dataset);



  const qualityScore =
    profile.quality.score;



  const insights =
    await generateInsights(
      profile
    );



  return {

    dataset: {

      name:
        dataset.name ||
        "Uploaded Dataset",

      rows:
        profile.rows,

      columns:
        profile.columns,

    },


    businessHealth:
      qualityScore,


    aiScore:
      qualityScore >= 90
        ? "A+"
        : qualityScore >= 75
        ? "A"
        : "B",


    insights,


    warnings:
      profile.quality.issues ?? [],


    recommendations:
      [
        "Improve datasets containing missing values.",
        "Monitor KPI performance regularly.",
        "Review detected anomalies.",
        "Use forecasting for future planning.",
      ],


  };

}
