/**
 Converts various global GPA scales to a standardized 4.0 US scale.
 Supports:
 - 4.0 Scale (US, Canada, etc.)
 - 5.0 Scale (Nigeria, Russia, etc.)
 - 10.0 Scale (India CGPA)
 - 100% Percentage Scale
 - German Scale (1.0 = best, 4.0 = passing, 5.0 = fail)
 */
export function normalizeGpaToFourPoint(gpa: number, scale = 4.0): number {
  if (!gpa || gpa <= 0) return 0.0;

  // Handle German Scale (where 1.0 is highest and 4.0 is minimum pass)
  if (scale === 1.0 || (gpa >= 1.0 && gpa <= 4.0 && scale === 5.0 && gpa < 1.6)) {
    // Bavarian Formula: GPA_US = 1.0 + 3.0 * ((Max - Actual) / (Max - Min))
    // For German: Max=1.0, Min=4.0 -> Formula: 4.0 - ((gpa - 1.0) / 3.0) * 3.0 = 4.0 - (gpa - 1.0)
    const normalizedGerman = Math.max(1.0, Math.min(4.0, gpa));
    return parseFloat((4.0 - (normalizedGerman - 1.0)).toFixed(2));
  }

  // Handle 100% Scale
  if (scale === 100 || gpa > 10.0) {
    if (gpa >= 85) return 4.0;
    if (gpa >= 75) return 3.5 + ((gpa - 75) / 10) * 0.5;
    if (gpa >= 65) return 3.0 + ((gpa - 65) / 10) * 0.5;
    if (gpa >= 55) return 2.5 + ((gpa - 55) / 10) * 0.5;
    if (gpa >= 45) return 2.0 + ((gpa - 45) / 10) * 0.5;
    return parseFloat((Math.max(0, gpa / 25)).toFixed(2));
  }

  // Handle 10.0 Scale (India CGPA)
  if (scale === 10.0 || (gpa > 5.0 && gpa <= 10.0)) {
    // Standard conversion: CGPA / 10 * 4.0
    return parseFloat(((gpa / 10.0) * 4.0).toFixed(2));
  }

  // Handle 5.0 Scale
  if (scale === 5.0) {
    return parseFloat(((gpa / 5.0) * 4.0).toFixed(2));
  }

  // Standard 4.0 Scale
  return parseFloat((Math.min(4.0, Math.max(0.0, gpa))).toFixed(2));
}
