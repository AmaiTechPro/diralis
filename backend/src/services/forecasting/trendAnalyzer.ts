export function analyzeTrend(
 values:number[]
){


 if(values.length < 2){

   return "INSUFFICIENT_DATA";

 }


 const first =
 values[0];


 const last =
 values[values.length-1];



 if(last > first){

   return "GROWING";

 }


 if(last < first){

   return "DECLINING";

 }


 return "STABLE";

}

