export interface TrendResult {

  direction:
    | "GROWING"
    | "DECLINING"
    | "STABLE";

  growthRate:number;

  momentum:
    | "STRONG"
    | "MODERATE"
    | "WEAK";

  signal:string;

}



export function analyzeTrend(
  values:number[]
):TrendResult {


  if(values.length < 2){

    return {

      direction:"STABLE",

      growthRate:0,

      momentum:"WEAK",

      signal:
        "Not enough data to detect trend"

    };

  }



  const first =
    values[0];


  const last =
    values[values.length - 1];



  const growthRate =
    ((last - first) / first) * 100;



  let direction:
    | "GROWING"
    | "DECLINING"
    | "STABLE";



  if(growthRate > 5){

    direction="GROWING";

  }
  else if(growthRate < -5){

    direction="DECLINING";

  }
  else{

    direction="STABLE";

  }



  let momentum:
    | "STRONG"
    | "MODERATE"
    | "WEAK";



  const absoluteGrowth =
    Math.abs(growthRate);



  if(absoluteGrowth > 25){

    momentum="STRONG";

  }
  else if(absoluteGrowth > 10){

    momentum="MODERATE";

  }
  else{

    momentum="WEAK";

  }



  let signal:string;



  if(direction==="GROWING"){

    signal =
      "Business performance is improving";

  }
  else if(direction==="DECLINING"){

    signal =
      "Business performance requires attention";

  }
  else{

    signal =
      "Business performance is relatively stable";

  }



  return {

    direction,

    growthRate:
      Number(
        growthRate.toFixed(2)
      ),

    momentum,

    signal

  };

}

