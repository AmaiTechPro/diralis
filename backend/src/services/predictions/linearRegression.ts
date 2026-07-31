export function linearRegressionPredict(
  values: number[],
  futurePoints = 5
): number[] {

  if (values.length < 2) {
    return [];
  }

  const n = values.length;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }

  const slope =
    (
      n * sumXY -
      sumX * sumY
    ) /
    (
      n * sumXX -
      sumX * sumX
    );

  const intercept =
    (sumY - slope * sumX) / n;

  const predictions: number[] = [];

  for (
    let i = n;
    i < n + futurePoints;
    i++
  ) {

    predictions.push(
      Number(
        (intercept + slope * i)
          .toFixed(2)
      )
    );

  }

  return predictions;

}

