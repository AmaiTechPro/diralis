export type ColumnScore = {
  column: string;
  score: number;
  reason: string;
};

const ignoredPatterns = [
  "id",
  "uuid",
  "email",
  "phone",
  "phone 1",
  "phone 2",
  "mobile",
  "telephone",
  "website",
  "url",
  "postal",
  "postcode",
  "zip",
  "fax",
  "ssn",
  "account",
  "reference",
];

const preferredPatterns = [
  "sales",
  "revenue",
  "profit",
  "income",
  "cost",
  "expense",
  "price",
  "amount",
  "quantity",
  "stock",
  "inventory",
  "customer",
  "country",
  "city",
  "category",
  "type",
  "status",
  "department",
  "region",
  "gender",
  "date",
  "year",
  "month",
];

export function scoreColumn(
  column: string
): ColumnScore {

  const name = column.toLowerCase();

  let score = 50;
  let reason = "Potential analytical column";

  for (const pattern of ignoredPatterns) {

    if (name.includes(pattern)) {

      score = 0;

      reason = "Identifier or contact field";

      return {
        column,
        score,
        reason,
      };

    }

  }

  for (const pattern of preferredPatterns) {

    if (name.includes(pattern)) {

      score += 30;

      reason = "High-value analytical column";

      break;

    }

  }

  return {
    column,
    score: Math.min(score, 100),
    reason,
  };

}

export function rankColumns(
  columns: string[]
): ColumnScore[] {

  return columns
    .map(scoreColumn)
    .filter(column => column.score > 0)
    .sort(
      (a, b) => b.score - a.score
    );

}

