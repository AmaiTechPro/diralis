export function detectTrend(
  values: number[]
): "Increasing" | "Decreasing" | "Stable" {

  if (values.length < 2) {
    return "Stable";
  }

  let positive = 0;
  let negative = 0;

  for (let i = 1; i < values.length; i++) {

    if (values[i] > values[i - 1]) {
      positive++;
    } else if (values[i] < values[i - 1]) {
      negative++;
    }

  }

  if (positive > negative) {
    return "Increasing";
  }

  if (negative > positive) {
    return "Decreasing";
  }

  return "Stable";
}

