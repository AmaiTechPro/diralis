import { useEffect, useState } from "react";

import { analyzePrediction }
from "../../services/predictionService";

import ForecastChart
from "./ForecastChart";


export default function PredictionPanel(
  {
    payload
  }:{
    payload:any
  }
){

  const [prediction,setPrediction] =
    useState<any>(null);


  useEffect(()=>{

    if(payload){

      analyzePrediction(payload)
        .then(setPrediction);

    }

  },[payload]);



  if(!prediction){

    return null;

  }



  return (

    <div className="rounded-xl border p-6 shadow">

      <h2 className="text-xl font-bold">
        🧠 AI Prediction Intelligence
      </h2>


      <p>
        Target:
        <strong>
          {" "}
          {prediction.context.targetColumn}
        </strong>
      </p>


      <p>
        Confidence:
        {" "}
        {prediction.context.confidence}
      </p>



      {prediction.trend && (

        <div className="mt-4">

          <h3 className="font-semibold">
            📈 Trend
          </h3>


          <p>
            Direction:
            {" "}
            {prediction.trend.direction}
          </p>


          <p>
            Growth:
            {" "}
            {prediction.trend.growthRate}%
          </p>


          <p>
            Momentum:
            {" "}
            {prediction.trend.momentum}
          </p>


        </div>

      )}



      {prediction.recommendation && (

        <div className="mt-4">

          <h3 className="font-semibold">
            🤖 Recommendation
          </h3>


          <p>
            {prediction.recommendation.recommendation}
          </p>

        </div>

      )}

      {/* Render the ForecastChart component if forecast data is available */}

      {prediction.forecast &&
      prediction.forecast.length > 0 && (

       <ForecastChart

      historical={
        payload.historicalValues
     }

      forecast={
       prediction.forecast
     }

    />

    )}


    </div>

  );

}

