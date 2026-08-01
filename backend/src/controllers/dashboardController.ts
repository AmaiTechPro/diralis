import { Request, Response } from "express";
import { getDashboardData } from "../services/dashboardService";

export async function dashboardController(
  req: Request,
  res: Response
) {
  const dashboard = await getDashboardData();

  res.json(dashboard);
}

