type VisualizationData = {
  labels: string[];
  values: number[];
};

export function topCategories(
  labels: string[],
  values: number[],
  limit = 5
): VisualizationData {

  const combined = labels.map((label, index) => ({
    label,
    value: values[index],
  }));

  combined.sort(
    (a, b) => b.value - a.value
  );

  const top = combined.slice(0, limit);

  const remaining =
    combined.slice(limit);

  const others =
    remaining.reduce(
      (sum, item) => sum + item.value,
      0
    );

  const result = {
    labels: top.map(item => item.label),
    values: top.map(item => item.value),
  };

  if (others > 0) {
    result.labels.push("Others");
    result.values.push(others);
  }

  return result;
}

