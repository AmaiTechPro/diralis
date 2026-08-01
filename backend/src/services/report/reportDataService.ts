import { profileDataset } from "../profiler/profileDataset";
import { calculateQualityScore } from "../profiler/calculateQualityScore";
import { generateInsights } from "../insights/generateInsights";



export async function buildReportData(
  dataset: any
) {


  const profile =
    await profileDataset(dataset);



  const qualityScore =
    calculateQualityScore(profile);



  const insights =
    await generateInsights(profile);



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
      profile.warnings || [],


    recommendations:
      profile.recommendations || [],


  };

}

