export interface RegressionDriver {
  featureName: string;
  rawCoefficient: number;
  standardizedBeta: number;
  varianceContributionPercent: number;
  vif: number;
  direction: "POSITIVE" | "NEGATIVE";
  significance: "DOMINANT" | "MODERATE" | "MARGINAL";
}

export interface MultiDriverResult {
  targetMetric: string;
  status: "SUCCESS" | "SINGULAR_MATRIX" | "INSUFFICIENT_OBSERVATIONS" | "COLLINEARITY_DETECTED";
  observationCount: number;
  featureCount: number;
  intercept: number;
  rSquared: number;
  adjustedRSquared: number;
  drivers: RegressionDriver[];
  warnings: string[];
}

export class MultiDriverEngine {
  /**
   * Deterministically solves multi-variable OLS regression using Gaussian elimination.
   */
  public static analyzeMultiVariableDrivers(
    targetName: string,
    featureNames: string[],
    rows: Record<string, any>[]
  ): MultiDriverResult {
    const warnings: string[] = [];
    const n = rows.length;
    const k = featureNames.length;

    if (n <= k + 1) {
      return {
        targetMetric: targetName,
        status: "INSUFFICIENT_OBSERVATIONS",
        observationCount: n,
        featureCount: k,
        intercept: 0,
        rSquared: 0,
        adjustedRSquared: 0,
        drivers: [],
        warnings: [`Need at least ${k + 2} valid observations for ${k} predictors; received ${n}.`],
      };
    }

    // Extract numerical vectors
    const Y: number[] = [];
    const X: number[][] = []; // n x (k+1) with intercept column 1

    for (const r of rows) {
      const yVal = Number(r[targetName]);
      if (isNaN(yVal)) continue;

      const rowX: number[] = [1]; // Intercept term x0 = 1
      let validRow = true;
      for (const f of featureNames) {
        const xVal = Number(r[f]);
        if (isNaN(xVal)) {
          validRow = false;
          break;
        }
        rowX.push(xVal);
      }
      if (validRow) {
        Y.push(yVal);
        X.push(rowX);
      }
    }

    const actualN = Y.length;
    if (actualN <= k + 1) {
      return {
        targetMetric: targetName,
        status: "INSUFFICIENT_OBSERVATIONS",
        observationCount: actualN,
        featureCount: k,
        intercept: 0,
        rSquared: 0,
        adjustedRSquared: 0,
        drivers: [],
        warnings: [`Insufficient non-null rows remaining (${actualN}) for ${k} predictors.`],
      };
    }

    // Compute (X^T * X) and (X^T * Y)
    const p = k + 1;
    const XtX: number[][] = Array.from({ length: p }, () => new Array(p).fill(0));
    const XtY: number[] = new Array(p).fill(0);

    for (let i = 0; i < actualN; i++) {
      for (let r = 0; r < p; r++) {
        XtY[r] += X[i][r] * Y[i];
        for (let c = 0; c < p; c++) {
          XtX[r][c] += X[i][r] * X[i][c];
        }
      }
    }

    // Solve (X^T * X) * beta = (X^T * Y) via Gaussian elimination with partial pivoting
    const beta = this.solveLinearSystem(XtX, XtY);
    if (!beta) {
      return {
        targetMetric: targetName,
        status: "SINGULAR_MATRIX",
        observationCount: actualN,
        featureCount: k,
        intercept: 0,
        rSquared: 0,
        adjustedRSquared: 0,
        drivers: [],
        warnings: ["Normal equations yielded a singular or collinear matrix; cannot invert."],
      };
    }

    const intercept = Number(beta[0].toFixed(4));
    const rawCoeffs = beta.slice(1);

    // Compute standard deviations for standardization
    const yMean = Y.reduce((a, b) => a + b, 0) / actualN;
    const yStd = Math.sqrt(Y.reduce((sum, v) => sum + Math.pow(v - yMean, 2), 0) / actualN) || 1;

    const xStds: number[] = [];
    for (let j = 0; j < k; j++) {
      const colVals = X.map((row) => row[j + 1]);
      const colMean = colVals.reduce((a, b) => a + b, 0) / actualN;
      const colStd = Math.sqrt(colVals.reduce((sum, v) => sum + Math.pow(v - colMean, 2), 0) / actualN) || 1;
      xStds.push(colStd);
    }

    // Compute R^2 and Adj R^2
    let ssTot = 0;
    let ssRes = 0;
    for (let i = 0; i < actualN; i++) {
      let yHat = beta[0];
      for (let j = 0; j < k; j++) {
        yHat += rawCoeffs[j] * X[i][j + 1];
      }
      ssTot += Math.pow(Y[i] - yMean, 2);
      ssRes += Math.pow(Y[i] - yHat, 2);
    }

    const rSquared = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);
    const adjustedRSquared = Math.max(0, 1 - ((1 - rSquared) * (actualN - 1)) / (actualN - k - 1));

    // Compute standardized Betas: beta_j * (std_x / std_y)
    const standardizedBetas = rawCoeffs.map((c, j) => c * (xStds[j] / yStd));
    const absSumBeta = standardizedBetas.reduce((sum, b) => sum + Math.abs(b), 0) || 1;

    // Estimate VIF for each predictor
    const vifs = this.calculateVIFs(X, k, actualN);

    const drivers: RegressionDriver[] = featureNames.map((name, j) => {
      const raw = Number(rawCoeffs[j].toFixed(4));
      const stdBeta = Number(standardizedBetas[j].toFixed(4));
      const contrib = Number(((Math.abs(standardizedBetas[j]) / absSumBeta) * 100).toFixed(2));
      const vifVal = Number(vifs[j].toFixed(2));

      let significance: "DOMINANT" | "MODERATE" | "MARGINAL" = "MARGINAL";
      if (contrib >= 40) significance = "DOMINANT";
      else if (contrib >= 15) significance = "MODERATE";

      if (vifVal > 5) {
        warnings.push(`High multicollinearity for '${name}' (VIF = ${vifVal}).`);
      }

      return {
        featureName: name,
        rawCoefficient: raw,
        standardizedBeta: stdBeta,
        varianceContributionPercent: contrib,
        vif: vifVal,
        direction: raw >= 0 ? "POSITIVE" : "NEGATIVE",
        significance,
      };
    });

    // Sort by absolute standardized contribution
    drivers.sort((a, b) => Math.abs(b.standardizedBeta) - Math.abs(a.standardizedBeta));

    return {
      targetMetric: targetName,
      status: "SUCCESS",
      observationCount: actualN,
      featureCount: k,
      intercept,
      rSquared: Number(rSquared.toFixed(4)),
      adjustedRSquared: Number(adjustedRSquared.toFixed(4)),
      drivers,
      warnings,
    };
  }

  /**
   * Helper to solve Ax = b via Gaussian elimination with partial pivoting.
   */
  private static solveLinearSystem(A: number[][], b: number[]): number[] | null {
    const n = b.length;
    const M: number[][] = A.map((row, i) => [...row, b[i]]);

    for (let p = 0; p < n; p++) {
      let max = p;
      for (let i = p + 1; i < n; i++) {
        if (Math.abs(M[i][p]) > Math.abs(M[max][p])) {
          max = i;
        }
      }

      const temp = M[p];
      M[p] = M[max];
      M[max] = temp;

      if (Math.abs(M[p][p]) <= 1e-12) {
        return null; // Singular matrix
      }

      for (let i = p + 1; i < n; i++) {
        const alpha = M[i][p] / M[p][p];
        for (let j = p; j <= n; j++) {
          M[i][j] -= alpha * M[p][j];
        }
      }
    }

    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = 0;
      for (let j = i + 1; j < n; j++) {
        sum += M[i][j] * x[j];
      }
      x[i] = (M[i][n] - sum) / M[i][i];
    }

    return x;
  }

  /**
   * Calculates VIF = 1 / (1 - R_j^2) for each predictor against all other predictors.
   */
  private static calculateVIFs(X: number[][], k: number, n: number): number[] {
    if (k === 1) return [1.0];

    const vifs: number[] = [];
    for (let targetIdx = 0; targetIdx < k; targetIdx++) {
      const otherIndices = Array.from({ length: k }, (_, idx) => idx).filter((idx) => idx !== targetIdx);
      const subX = X.map((row) => [1, ...otherIndices.map((idx) => row[idx + 1])]);
      const subY = X.map((row) => row[targetIdx + 1]);

      const subP = subX[0].length;
      const XtX: number[][] = Array.from({ length: subP }, () => new Array(subP).fill(0));
      const XtY: number[] = new Array(subP).fill(0);

      for (let i = 0; i < n; i++) {
        for (let r = 0; r < subP; r++) {
          XtY[r] += subX[i][r] * subY[i];
          for (let c = 0; c < subP; c++) {
            XtX[r][c] += subX[i][r] * subX[i][c];
          }
        }
      }

      const beta = this.solveLinearSystem(XtX, XtY);
      if (!beta) {
        vifs.push(999.0); // Extreme collinearity
        continue;
      }

      const meanY = subY.reduce((a, b) => a + b, 0) / n;
      let ssTot = 0;
      let ssRes = 0;
      for (let i = 0; i < n; i++) {
        let yHat = beta[0];
        for (let j = 0; j < otherIndices.length; j++) {
          yHat += beta[j + 1] * subX[i][j + 1];
        }
        ssTot += Math.pow(subY[i] - meanY, 2);
        ssRes += Math.pow(subY[i] - yHat, 2);
      }

      const r2 = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);
      const vif = r2 >= 0.999 ? 999.0 : 1 / (1 - r2);
      vifs.push(vif);
    }

    return vifs;
  }
}



