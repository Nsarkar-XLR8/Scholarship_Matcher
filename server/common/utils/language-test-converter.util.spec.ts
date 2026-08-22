import {
  toeflToIelts,
  ieltsToToefl,
  duolingoToIelts,
  ieltsToDuolingo,
  pteToIelts,
  ieltsToPte,
  calculateEquivalentMinimumScores,
  getScoreRequirementsBreakdown,
} from './language-test-converter.util';

describe('Language Test Converter & Equivalency Engine', () => {
  it('should convert TOEFL iBT scores to equivalent IELTS band scores accurately', () => {
    expect(toeflToIelts(100)).toBe(7.0);
    expect(toeflToIelts(110)).toBe(8.0);
    expect(toeflToIelts(80)).toBe(6.5);
  });

  it('should convert IELTS band scores to equivalent TOEFL iBT scores accurately', () => {
    expect(ieltsToToefl(7.0)).toBe(94);
    expect(ieltsToToefl(7.5)).toBe(102);
    expect(ieltsToToefl(6.5)).toBe(79);
  });

  it('should convert Duolingo scores to equivalent IELTS band scores accurately', () => {
    expect(duolingoToIelts(125)).toBe(7.0);
    expect(duolingoToIelts(135)).toBe(7.5);
    expect(duolingoToIelts(110)).toBe(6.5);
  });

  it('should convert PTE Academic scores to equivalent IELTS band scores accurately', () => {
    expect(pteToIelts(65)).toBe(7.0);
    expect(pteToIelts(76)).toBe(7.5);
    expect(pteToIelts(58)).toBe(6.5);
  });

  it('should calculate equivalent minimum scores across all tests when only IELTS is specified', () => {
    const result = calculateEquivalentMinimumScores({ minIelts: 7.0 });
    expect(result.ielts).toBe(7.0);
    expect(result.toefl).toBe(94);
    expect(result.duolingo).toBe(125);
    expect(result.pte).toBe(65);
  });

  it('should generate complete score requirements breakdown showing required points for applying', () => {
    const breakdown = getScoreRequirementsBreakdown({
      minGpa: 3.2,
      minIelts: 6.5,
      minGre: 315,
      workExpYearsRequired: 2,
    });

    expect(breakdown.minimumGpa.normalizedUs4Scale).toBe(3.2);
    expect(breakdown.englishProficiency.ielts).toBe(6.5);
    expect(breakdown.englishProficiency.toefl).toBe(79);
    expect(breakdown.englishProficiency.duolingo).toBe(110);
    expect(breakdown.englishProficiency.pte).toBe(58);
    expect(breakdown.englishProficiency.summaryText).toContain('IELTS: 6.5 OR TOEFL: 79 OR Duolingo: 110 OR PTE: 58');
    expect(breakdown.standardizedTests.gre).toBe(315);
    expect(breakdown.experience.workExpYears).toBe(2);
  });
});
