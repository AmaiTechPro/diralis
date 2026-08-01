export function calculateMovingAverage(
  values:number[],
  window:number = 3
):number[] {


  if(values.length < window){
    return values;
  }


  const forecast:number[] = [];


  for(
    let i = 0;
    i <= values.length - window;
    i++
  ){

    const slice =
      values.slice(
        i,
        i + window
      );


    const average =
      slice.reduce(
        (a,b)=>a+b,
        0
      ) / window;


    forecast.push(
      Number(
        average.toFixed(2)
      )
    );

  }


  return forecast;

}

