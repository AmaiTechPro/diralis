export function generateForecast(
  values:number[],
  periods:number = 3
):number[] {


  if(values.length < 2){

    return [];

  }


  const growth =
    values[values.length - 1]
    -
    values[values.length - 2];


  const forecast:number[] = [];


  let last =
    values[values.length - 1];


  for(let i = 0; i < periods; i++){

    last += growth;

    forecast.push(
      Number(
        last.toFixed(2)
      )
    );

  }


  return forecast;

}

