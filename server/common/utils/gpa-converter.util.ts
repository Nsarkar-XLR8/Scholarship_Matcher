/**
 * Converts various global academic grading scales to a standardized 4.0 US scale.
 * Supports:
 * - US/Canada 4.0 Scale
 * - German Inverse Scale (1.0 = Highest / Best, 4.0 = Minimum Pass, 5.0 = Fail) using Modified Bavarian Formula
 * - UK Honours Degree Classification (First Class = 4.0, 2:1 Upper Second = 3.4, 2:2 Lower Second = 2.8, 3rd = 2.0)
 * - 10.0 Scale (India CGPA, Malaysia, Nordic 10-scale)
 * - 5.0 Scale (Nigeria, Russia, Eastern Europe)
 * - 100% Percentage Scale
 */
export function normalizeGpaToFourPoint(gpa: number, scale: number | string = 4.0): number {
  if (!gpa || gpa <= 0) return 0.0;

  const scaleStr = typeof scale === 'string' ? scale.toUpperCase() : '';

  // Handle German Scale (Inverse: 1.0 is top score, 4.0 is pass)
  if (scaleStr.includes('GERMAN') || scale === 1.0 || (gpa >= 1.0 && gpa <= 4.0 && scale === 5.0 && gpa < 1.6)) {
    // Modified Bavarian Formula: US_GPA = 4.0 - ((N_actual - 1.0) / (4.0 - 1.0)) * 3.0
    const clampedGerman = Math.max(1.0, Math.min(4.0, gpa));
    const converted = 4.0 - ((clampedGerman - 1.0) / 3.0) * 3.0;
    return parseFloat(converted.toFixed(2));
  }

  // Handle UK Degree Classification
  if (scaleStr.includes('UK') || scaleStr.includes('HONOURS')) {
    if (gpa >= 70 || gpa === 1) return 4.0; // 1st Class
    if (gpa >= 60 || gpa === 2.1) return 3.4; // 2:1 Upper Second
    if (gpa >= 50 || gpa === 2.2) return 2.8; // 2:2 Lower Second
    if (gpa >= 40 || gpa === 3) return 2.0;   // 3rd Class
    return 1.5;
  }

  // Handle 100% Percentage Scale
  if (scale === 100 || scaleStr.includes('PERCENT') || gpa > 10.0) {
    if (gpa >= 85) return 4.0;
    if (gpa >= 75) return 3.5 + ((gpa - 75) / 10) * 0.5;
    if (gpa >= 65) return 3.0 + ((gpa - 65) / 10) * 0.5;
    if (gpa >= 55) return 2.5 + ((gpa - 55) / 10) * 0.5;
    if (gpa >= 45) return 2.0 + ((gpa - 45) / 10) * 0.5;
    return parseFloat((Math.max(0, gpa / 25)).toFixed(2));
  }

  // Handle 10.0 Scale (India CGPA)
  if (scale === 10.0 || scaleStr.includes('10') || (gpa > 5.0 && gpa <= 10.0)) {
    if (gpa >= 9.0) return 4.0;
    if (gpa >= 8.0) return parseFloat((3.6 + ((gpa - 8.0) / 1.0) * 0.4).toFixed(2));
    if (gpa >= 7.0) return parseFloat((3.0 + ((gpa - 7.0) / 1.0) * 0.6).toFixed(2));
    if (gpa >= 6.0) return parseFloat((2.5 + ((gpa - 6.0) / 1.0) * 0.5).toFixed(2));
    return parseFloat(((gpa / 10.0) * 4.0).toFixed(2));
  }

  // Handle 5.0 Scale
  if (scale === 5.0 || scaleStr.includes('5')) {
    return parseFloat(((gpa / 5.0) * 4.0).toFixed(2));
  }

  // Standard 4.0 Scale
  return parseFloat((Math.min(4.0, Math.max(0.0, gpa))).toFixed(2));
}
