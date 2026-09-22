import { convertToEcts, evaluateCreditPrerequisites } from './credit-converter.util';

describe('CreditConverterUtil', () => {
  describe('convertToEcts', () => {
    it('should return exact credits for ECTS scale', () => {
      expect(convertToEcts(30, 'ECTS')).toBe(30);
    });

    it('should convert US semester credit hours correctly (1.5 multiplier)', () => {
      expect(convertToEcts(12, 'US_SEMESTER')).toBe(18);
    });

    it('should convert Indian semester credits correctly (1.5 multiplier)', () => {
      expect(convertToEcts(10, 'INDIAN_SEMESTER')).toBe(15);
    });

    it('should convert UK CATS credits correctly (0.5 multiplier)', () => {
      expect(convertToEcts(40, 'UK_CATS')).toBe(20);
    });

    it('should return 0 for invalid or empty inputs', () => {
      expect(convertToEcts(null as any)).toBe(0);
      expect(convertToEcts(undefined as any)).toBe(0);
      expect(convertToEcts(-5)).toBe(0);
    });
  });

  describe('evaluateCreditPrerequisites', () => {
    it('should return NOT_APPLICABLE if program has no prerequisite barriers', () => {
      const res = evaluateCreditPrerequisites(
        { mathCredits: 10 },
        { minMathEcts: 0, minCsEcts: 0, minTheoreticalEcts: 0 }
      );
      expect(res.status).toBe('NOT_APPLICABLE');
      expect(res.isEligibleForAdmission).toBe(true);
    });

    it('should return PREREQUISITES_SATISFIED when student exceeds all requirements', () => {
      const res = evaluateCreditPrerequisites(
        { mathCredits: 20, csCredits: 25, theoreticalCredits: 15, creditScale: 'ECTS' },
        { minMathEcts: 18, minCsEcts: 15, minTheoreticalEcts: 10 }
      );
      expect(res.status).toBe('PREREQUISITES_SATISFIED');
      expect(res.deficits.totalDeficitEcts).toBe(0);
      expect(res.isEligibleForAdmission).toBe(true);
    });

    it('should return CONDITIONAL_BRIDGE_ELIGIBLE for deficit <= 15 ECTS', () => {
      const res = evaluateCreditPrerequisites(
        { mathCredits: 12, csCredits: 15, theoreticalCredits: 10, creditScale: 'ECTS' },
        { minMathEcts: 18, minCsEcts: 15, minTheoreticalEcts: 10 }
      );
      expect(res.status).toBe('CONDITIONAL_BRIDGE_ELIGIBLE');
      expect(res.deficits.mathDeficitEcts).toBe(6);
      expect(res.deficits.totalDeficitEcts).toBe(6);
      expect(res.isEligibleForAdmission).toBe(true);
    });

    it('should return HARD_PREREQUISITE_DEFICIT for deficit > 15 ECTS', () => {
      const res = evaluateCreditPrerequisites(
        { mathCredits: 0, csCredits: 0, theoreticalCredits: 0, creditScale: 'ECTS' },
        { minMathEcts: 18, minCsEcts: 15, minTheoreticalEcts: 10 }
      );
      expect(res.status).toBe('HARD_PREREQUISITE_DEFICIT');
      expect(res.deficits.totalDeficitEcts).toBe(43);
      expect(res.isEligibleForAdmission).toBe(false);
    });
  });
});
