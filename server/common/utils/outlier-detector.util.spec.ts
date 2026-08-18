import { isScholarshipOutlier } from './outlier-detector.util';

describe('Outlier Detector Utility', () => {
  const existingReports = [25.0, 30.0, 35.0, 30.0, 25.0, 40.0, 30.0];

  it('should not flag normal values within historical distribution', () => {
    const result = isScholarshipOutlier(30.0, existingReports);
    expect(result.isOutlier).toBe(false);
  });

  it('should flag extreme outliers with high Z-score / IQR deviation', () => {
    const result = isScholarshipOutlier(100.0, existingReports);
    expect(result.isOutlier).toBe(true);
    expect(result.reason).toBeDefined();
  });

  it('should return isOutlier false if historical dataset is too small', () => {
    const result = isScholarshipOutlier(100.0, [50.0]);
    expect(result.isOutlier).toBe(false);
  });
});
