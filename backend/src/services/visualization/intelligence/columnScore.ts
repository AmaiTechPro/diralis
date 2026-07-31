import KEYWORDS from "./columnKnowledge";

export interface ColumnScore {
  column: string;
  score: number;
}

export function scoreColumns(
  columns: string[],
  type:
    | "metric"
    | "category"
    | "identifier"
    | "date"
): ColumnScore[] {

  return columns.map((column) => {

    const lower =
      column
        .toLowerCase()
        .replace(/[\s_-]/g, "");

    let score = 0;

    for (const keyword of KEYWORDS[type]) {

      if (lower.includes(keyword)) {
        score += 100;
      }

    }

    // Prefer shorter, meaningful names
    score -= lower.length * 0.1;

    return {
      column,
      score,
    };

  })
  .sort((a, b) => b.score - a.score);

}

