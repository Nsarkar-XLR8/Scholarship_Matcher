/**
 * Standardized Language Test Equivalency Matrix and Score Requirement Calculation Engine.
 * Supports: IELTS Academic, TOEFL iBT, Duolingo English Test (DET), PTE Academic.
 */

export interface TestScoreRequirementsBreakdown {
  minimumGpa: {
    normalizedUs4Scale: number;
    originalNativeScale: number;
    scaleName: string;
    nativeEquivalentText: string;
  };
  englishProficiency: {
    ielts: number | null;
    toefl: number | null;
    duolingo: number | null;
    pte: number | null;
    summaryText: string;
  };
  standardizedTests: {
    gre: number | null;
    gmat: number | null;
  };
  experience: {
    workExpYears: number;
    researchPapersCount: number;
  };
}

/**
 * Converts TOEFL iBT score to equivalent IELTS Academic band score
 */
export function toeflToIelts(toefl: number): number {
  if (toefl >= 118) return 9.0;
  if (toefl >= 115) return 8.5;
  if (toefl >= 110) return 8.0;
  if (toefl >= 102) return 7.5;
  if (toefl >= 94) return 7.0;
  if (toefl >= 79) return 6.5;
  if (toefl >= 60) return 6.0;
  if (toefl >= 46) return 5.5;
  if (toefl >= 35) return 5.0;
  return 4.5;
}

/**
 * Converts IELTS Academic band score to equivalent TOEFL iBT score
 */
export function ieltsToToefl(ielts: number): number {
  if (ielts >= 9.0) return 118;
  if (ielts >= 8.5) return 115;
  if (ielts >= 8.0) return 110;
  if (ielts >= 7.5) return 102;
  if (ielts >= 7.0) return 94;
  if (ielts >= 6.5) return 79;
  if (ielts >= 6.0) return 60;
  if (ielts >= 5.5) return 46;
  return 35;
}

/**
 * Converts Duolingo English Test (DET) score to equivalent IELTS band score
 */
export function duolingoToIelts(duolingo: number): number {
  if (duolingo >= 155) return 8.5;
  if (duolingo >= 145) return 8.0;
  if (duolingo >= 135) return 7.5;
  if (duolingo >= 125) return 7.0;
  if (duolingo >= 110) return 6.5;
  if (duolingo >= 95) return 6.0;
  if (duolingo >= 85) return 5.5;
  return 5.0;
}

/**
 * Converts IELTS band score to equivalent Duolingo score
 */
export function ieltsToDuolingo(ielts: number): number {
  if (ielts >= 8.5) return 155;
  if (ielts >= 8.0) return 145;
  if (ielts >= 7.5) return 135;
  if (ielts >= 7.0) return 125;
  if (ielts >= 6.5) return 110;
  if (ielts >= 6.0) return 95;
  if (ielts >= 5.5) return 85;
  return 75;
}

/**
 * Converts PTE Academic score to equivalent IELTS band score
 */
export function pteToIelts(pte: number): number {
  if (pte >= 86) return 8.5;
  if (pte >= 84) return 8.0;
  if (pte >= 76) return 7.5;
  if (pte >= 65) return 7.0;
  if (pte >= 58) return 6.5;
  if (pte >= 50) return 6.0;
  if (pte >= 43) return 5.5;
  return 5.0;
}

/**
 * Converts IELTS band score to equivalent PTE Academic score
 */
export function ieltsToPte(ielts: number): number {
  if (ielts >= 8.5) return 86;
  if (ielts >= 8.0) return 84;
  if (ielts >= 7.5) return 76;
  if (ielts >= 7.0) return 65;
  if (ielts >= 6.5) return 58;
  if (ielts >= 6.0) return 50;
  if (ielts >= 5.5) return 43;
  return 36;
}

/**
 * Given explicit or partial minimum test score requirements, calculates equivalent minimum scores
 * across all major English proficiency tests so students know exactly how many points they need to apply.
 */
export function calculateEquivalentMinimumScores(req: {
  minIelts?: number | null;
  minToefl?: number | null;
  minDuolingo?: number | null;
  minPte?: number | null;
}): { ielts: number | null; toefl: number | null; duolingo: number | null; pte: number | null } {
  let baseIelts: number | null = req.minIelts || null;

  if (!baseIelts) {
    if (req.minToefl) baseIelts = toeflToIelts(req.minToefl);
    else if (req.minDuolingo) baseIelts = duolingoToIelts(req.minDuolingo);
    else if (req.minPte) baseIelts = pteToIelts(req.minPte);
  }

  if (!baseIelts) {
    return {
      ielts: req.minIelts || null,
      toefl: req.minToefl || null,
      duolingo: req.minDuolingo || null,
      pte: req.minPte || null,
    };
  }

  return {
    ielts: req.minIelts || baseIelts,
    toefl: req.minToefl || ieltsToToefl(baseIelts),
    duolingo: req.minDuolingo || ieltsToDuolingo(baseIelts),
    pte: req.minPte || ieltsToPte(baseIelts),
  };
}

/**
 * Formats native GPA equivalent descriptive text based on 4.0 US score
 */
export function formatNativeGpaEquivalent(minGpa4Scale: number): string {
  if (minGpa4Scale >= 3.7) {
    return "1.0 - 1.3 (German Scale) | First Class Honours (UK) | 8.5+ CGPA (India)";
  } else if (minGpa4Scale >= 3.3) {
    return "1.4 - 1.8 (German Scale) | 2:1 Upper Second Class (UK) | 7.5 - 8.4 CGPA (India)";
  } else if (minGpa4Scale >= 3.0) {
    return "1.9 - 2.3 (German Scale) | 2:1 / 2:2 Honours (UK) | 6.8 - 7.4 CGPA (India)";
  } else if (minGpa4Scale >= 2.5) {
    return "2.4 - 2.8 (German Scale) | 2:2 Lower Second Class (UK) | 5.5 - 6.7 CGPA (India)";
  }
  return "2.9 - 3.5 (German Scale) | Pass Degree | <5.5 CGPA";
}

/**
 * Generates human-readable score requirement summary for a program
 */
export function getScoreRequirementsBreakdown(req: {
  minGpa: number;
  minGpaOriginal?: number;
  gpaScaleName?: string;
  minIelts?: number | null;
  minToefl?: number | null;
  minDuolingo?: number | null;
  minPte?: number | null;
  minGre?: number | null;
  minGmat?: number | null;
  workExpYearsRequired?: number;
  minPapersCount?: number;
}): TestScoreRequirementsBreakdown {
  const english = calculateEquivalentMinimumScores(req);

  const testParts: string[] = [];
  if (english.ielts) testParts.push(`IELTS: ${english.ielts}`);
  if (english.toefl) testParts.push(`TOEFL: ${english.toefl}`);
  if (english.duolingo) testParts.push(`Duolingo: ${english.duolingo}`);
  if (english.pte) testParts.push(`PTE: ${english.pte}`);

  const summaryText = testParts.length > 0
    ? `Required Scores for Applying: ${testParts.join(' OR ')}`
    : 'No strict standardized English score specified (or Medium of Instruction letter accepted)';

  return {
    minimumGpa: {
      normalizedUs4Scale: req.minGpa,
      originalNativeScale: req.minGpaOriginal || req.minGpa,
      scaleName: req.gpaScaleName || 'US 4.0 Scale',
      nativeEquivalentText: formatNativeGpaEquivalent(req.minGpa),
    },
    englishProficiency: {
      ielts: english.ielts,
      toefl: english.toefl,
      duolingo: english.duolingo,
      pte: english.pte,
      summaryText,
    },
    standardizedTests: {
      gre: req.minGre || null,
      gmat: req.minGmat || null,
    },
    experience: {
      workExpYears: req.workExpYearsRequired || 0,
      researchPapersCount: req.minPapersCount || 0,
    },
  };
}
