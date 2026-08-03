import { Request, Response } from "express";
import { getDashboardData } from "../services/dashboardService";

export async function dashboardController(
  req: Request,
  res: Response
) {

  console.log("Dashboard req.user:", req.user);
console.log("Authorization:", req.headers.authorization);
  const dashboard = await getDashboardData(
    req.user!.userId
  );

  res.json(dashboard);
}

