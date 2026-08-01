import { detectForecastCapability }
from "./forecastDetector";


import { calculateMovingAverage }
from "./forecastCalculator";


import { analyzeTrend }
from "./trendAnalyzer";



export function generateForecast(
 context:any
){


 const available =
 detectForecastCapability(
   context
 );



 if(!available){

 return {

 available:false,

 confidence:"LOW",

 message:`

Forecasting unavailable.

Diralis requires:

• Historical dates
• Revenue/sales metrics
• Multiple business records

`

 };

 }



 const values =
 context.numericValues ?? [];



 if(values.length < 3){

 return {

 available:false,

 confidence:"LOW",

 message:`

Forecasting requires more historical observations.

Recommended:
Upload more time-based business records.

`

 };

 }



 const prediction =
 calculateMovingAverage(
   values
 );



 const trend =
 analyzeTrend(
   values
 );



 return {


 available:true,


 confidence:"MEDIUM",


 trend,


 predictedValues:
 prediction,


 message:`

Forecast Generated:

Trend:
${trend}


Predicted Values:

${prediction.join(", ")}

`

 };


}

