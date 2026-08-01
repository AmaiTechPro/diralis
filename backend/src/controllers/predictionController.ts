import { Request, Response } from "express";

import { generatePredictionInsights }
from "../services/predictions/predictionEngine";


export async function analyzePrediction(
  req: Request,
  res: Response
){

  try {

    const {
      context,
      rows
    } = req.body;


    const result =
      generatePredictionInsights(
        context,
        rows
      );


    res.json(result);


  } catch(error){

    res.status(500).json({

      message:
        "Prediction analysis failed",

      error

    });

  }

}

