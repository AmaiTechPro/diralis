import { Request, Response } from "express";
import prisma from "../lib/prisma";

import { generateDatasetProfile } from "../services/analyticsService";
import { getOverallInsights } from "../services/insights/overallInsights";

export async function overallInsightsController(
  req: Request,
  res: Response
) {
  const datasets = await prisma.dataset.findMany();

  const analytics = await Promise.all(
    datasets.map(async (dataset) => {

      const profile =
        await generateDatasetProfile(dataset.id);

      return {
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
      };
    })
  );

  res.json(
    getOverallInsights({
      datasets: analytics,
    })
  );
}

