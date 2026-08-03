import { Request, Response } from "express";
import prisma from "../lib/prisma";

import { generateDatasetProfile } from "../services/analyticsService";
import { getOverallInsights } from "../services/insights/overallInsights";


        
export async function overallInsightsController(
  req: Request,
  res: Response
) {
  const datasets = await prisma.dataset.findMany();

  const analytics = [];

for (const dataset of datasets) {
  try {

    const profile =
      await generateDatasetProfile(dataset.id);

    analytics.push({
      quality: profile.profile.quality.score,

      insights:
        profile.insights.business.length +
        profile.insights.statistics.length +
        profile.insights.forecast.length,

      warnings:
        profile.profile.quality.issues.length,

      recommendations: [
        ...profile.insights.business,
        ...profile.insights.forecast,
      ],
    });

  } catch (error) {

    console.warn(
      `Skipping dataset ${dataset.originalName}:`,
      (error as Error).message
    );

  }
}

  res.json(
    getOverallInsights({
      datasets: analytics,
    })
  );
}

   {/*End of Debugging 


   export async function overallInsightsController(
  req: Request,
  res: Response
) {
  try {

    const datasets = await prisma.dataset.findMany();

    const analytics = [];

    for (const dataset of datasets) {
      try {

        const profile =
          await generateDatasetProfile(dataset.id);

        analytics.push({
          quality: profile.profile.quality.score,

          insights:
            profile.insights.business.length +
            profile.insights.statistics.length +
            profile.insights.forecast.length,

          warnings:
            profile.profile.quality.issues.length,

          recommendations: [
            ...profile.insights.business,
            ...profile.insights.forecast,
          ],
        });

      } catch (error) {

        console.warn(
          `Skipping ${dataset.originalName}:`,
          error
        );

      }
    }

    res.json(
      getOverallInsights({
        datasets: analytics,
      })
    );

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: (error as Error).message,
    });

  }
}
 */}
