import { normalizeGpaToFourPoint } from './gpa-converter.util';

describe('GPA Converter Utility', () => {
  it('should pass through 4.0 scale values correctly', () => {
    expect(normalizeGpaToFourPoint(3.5, 4.0)).toBe(3.5);
    expect(normalizeGpaToFourPoint(4.0, 4.0)).toBe(4.0);
    expect(normalizeGpaToFourPoint(2.0, 4.0)).toBe(2.0);
  });

  it('should normalize 10.0 scale (India CGPA) to 4.0 scale', () => {
    expect(normalizeGpaToFourPoint(8.5, 10.0)).toBe(3.4);
    expect(normalizeGpaToFourPoint(10.0, 10.0)).toBe(4.0);
    expect(normalizeGpaToFourPoint(7.0, 10.0)).toBe(2.8);
  });

  it('should normalize 5.0 scale to 4.0 scale', () => {
    expect(normalizeGpaToFourPoint(4.5, 5.0)).toBe(3.6);
    expect(normalizeGpaToFourPoint(5.0, 5.0)).toBe(4.0);
  });

  it('should normalize 100% percentage scale', () => {
    expect(normalizeGpaToFourPoint(90, 100)).toBe(4.0);
    expect(normalizeGpaToFourPoint(80, 100)).toBe(3.75);
    expect(normalizeGpaToFourPoint(70, 100)).toBe(3.25);
  });

  it('should normalize German scale (1.0 = best, 4.0 = passing)', () => {
    expect(normalizeGpaToFourPoint(1.0, 1.0)).toBe(4.0);
    expect(normalizeGpaToFourPoint(2.5, 1.0)).toBe(2.5);
    expect(normalizeGpaToFourPoint(4.0, 1.0)).toBe(1.0);
  });
});
