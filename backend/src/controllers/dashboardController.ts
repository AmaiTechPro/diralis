import { Request, Response } from "express";
import { getDashboardData } from "../services/dashboardService";

export function dashboardController(
  req: Request,
  res: Response
) {
  const dashboard = getDashboardData();

  res.json(dashboard);
}

