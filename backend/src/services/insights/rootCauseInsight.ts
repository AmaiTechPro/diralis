import { CorrelationResult } from "../../types/profile";

const BLOCKED_TOKENS = ["id", "index", "uuid", "key", "row"];

function isBlocked(name: string): boolean {
  const lower = name.toLowerCase().trim();
  return BLOCKED_TOKENS.some((token) => lower === token || lower.includes(token));
}

export function generateRootCauseInsights(
  correlations: CorrelationResult[]
): string[] {
  const insights: string[] = [];
  const seenPairs = new Set<string>();

  // Filter out self-correlations, identifiers, and deduplicate A-B / B-A
  const validCorrelations = correlations.filter((c) => {
    if (c.columnA === c.columnB) return false;
    if (isBlocked(c.columnA) || isBlocked(c.columnB)) return false;

    const pairKey = [c.columnA, c.columnB].sort().join("::");
    if (seenPairs.has(pairKey)) return false;
    seenPairs.add(pairKey);

    return true;
  });

  // Highlight strongest unique non-tautological relationships (0.75 <= |r| <= 0.98)
  // Relationships with |r| > 0.98 are typically accounting identities or linear combinations
  for (const correlation of validCorrelations) {
    const absR = Math.abs(correlation.coefficient);

    if (absR >= 0.75 && absR <= 0.98) {
      if (correlation.coefficient > 0) {
        insights.push(
          `Strong positive movement observed between ${correlation.columnA} and ${correlation.columnB} (r = ${correlation.coefficient.toFixed(2)}).`
        );
      } else {
        insights.push(
          `Inverse relationship detected: ${correlation.columnA} shifts opposite to ${correlation.columnB} (r = ${correlation.coefficient.toFixed(2)}).`
        );
      }
    }

    if (insights.length >= 4) break;
  }

  if (!insights.length) {
    insights.push(
      "No critical multi-variable operational anomalies or risk dependencies detected."
    );
  }

  return insights;
}


