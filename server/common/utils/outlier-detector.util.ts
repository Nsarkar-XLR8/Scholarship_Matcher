/**
 Statistical Outlier Detection using Interquartile Range (IQR) and Z-score
 Used to flag suspicious crowdsourced scholarship percentage reports.
 */
export function isScholarshipOutlier(
  newScholarshipPct: number,
  existingValues: number[]
): { isOutlier: boolean; zScore: number; reason?: string } {
  if (!existingValues || existingValues.length < 4) {
    // Insufficient historical data to determine outlier status accurately
    return { isOutlier: false, zScore: 0 };
  }

  // 1. Z-Score Calculation
  const n = existingValues.length;
  const mean = existingValues.reduce((sum, val) => sum + val, 0) / n;
  const variance = existingValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  let zScore = 0;
  if (stdDev > 0) {
    zScore = (newScholarshipPct - mean) / stdDev;
  }

  // 2. IQR Calculation
  const sorted = [...existingValues].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;

  const lowerBound = Math.max(0, q1 - 1.5 * iqr);
  const upperBound = Math.min(100, q3 + 1.5 * iqr);

  const isIqrOutlier = newScholarshipPct < lowerBound || newScholarshipPct > upperBound;
  const isZScoreOutlier = Math.abs(zScore) > 3.0; // Standard 3-sigma rule

  if (isIqrOutlier || isZScoreOutlier) {
    return {
      isOutlier: true,
      zScore: parseFloat(zScore.toFixed(2)),
      reason: `Reported value (${newScholarshipPct}%) deviates significantly from historical mean (${mean.toFixed(1)}%, range [${lowerBound.toFixed(1)}% - ${upperBound.toFixed(1)}%])`,
    };
  }

  return { isOutlier: false, zScore: parseFloat(zScore.toFixed(2)) };
}
