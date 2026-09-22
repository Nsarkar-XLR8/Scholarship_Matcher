/**
 * International Academic Credit System Converter & Prerequisite Evaluator
 * Supports ECTS (Europe), US Semester Hours, Indian Semester Credits, and UK CATS.
 */

export type InternationalCreditScale = 'ECTS' | 'US_SEMESTER' | 'INDIAN_SEMESTER' | 'UK_CATS';

export interface StudentCreditProfile {
  mathCredits?: number;
  csCredits?: number;
  theoreticalCredits?: number;
  creditScale?: InternationalCreditScale;
}

export interface ProgramPrerequisiteThresholds {
  minMathEcts?: number;
  minCsEcts?: number;
  minTheoreticalEcts?: number;
}

export interface PrerequisiteEvaluationResult {
  status: 'PREREQUISITES_SATISFIED' | 'CONDITIONAL_BRIDGE_ELIGIBLE' | 'HARD_PREREQUISITE_DEFICIT' | 'NOT_APPLICABLE';
  normalizedStudentCredits: {
    mathEcts: number;
    csEcts: number;
    theoreticalEcts: number;
    scaleUsed: InternationalCreditScale;
  };
  deficits: {
    mathDeficitEcts: number;
    csDeficitEcts: number;
    theoreticalDeficitEcts: number;
    totalDeficitEcts: number;
  };
  summaryMessage: string;
  isEligibleForAdmission: boolean;
}

/**
 * Converts foreign academic credits into European ECTS equivalent
 * Multipliers:
 * - ECTS: 1.0
 * - US Semester Credit Hours: 1.5 (e.g. 3 US credits = 4.5 to 5 ECTS)
 * - Indian Semester Credits: 1.5 (e.g. 4 credits = 6 ECTS)
 * - UK CATS Credits: 0.5 (e.g. 20 CATS = 10 ECTS)
 */
export function convertToEcts(credits: number | undefined | null, scale: InternationalCreditScale = 'ECTS'): number {
  if (!credits || isNaN(credits) || credits <= 0) return 0;

  switch (scale) {
    case 'US_SEMESTER':
      return Number((credits * 1.5).toFixed(1));
    case 'INDIAN_SEMESTER':
      return Number((credits * 1.5).toFixed(1));
    case 'UK_CATS':
      return Number((credits * 0.5).toFixed(1));
    case 'ECTS':
    default:
      return Number(credits.toFixed(1));
  }
}

/**
 * Evaluates student undergraduate credit background against strict program prerequisites
 */
export function evaluateCreditPrerequisites(
  student: StudentCreditProfile,
  programReqs: ProgramPrerequisiteThresholds
): PrerequisiteEvaluationResult {
  const scale = student.creditScale || 'ECTS';

  const reqMath = programReqs.minMathEcts || 0;
  const reqCs = programReqs.minCsEcts || 0;
  const reqTheory = programReqs.minTheoreticalEcts || 0;

  // If the program does not have hard prerequisite barriers, return NOT_APPLICABLE
  if (reqMath === 0 && reqCs === 0 && reqTheory === 0) {
    return {
      status: 'NOT_APPLICABLE',
      normalizedStudentCredits: {
        mathEcts: convertToEcts(student.mathCredits, scale),
        csEcts: convertToEcts(student.csCredits, scale),
        theoreticalEcts: convertToEcts(student.theoreticalCredits, scale),
        scaleUsed: scale,
      },
      deficits: {
        mathDeficitEcts: 0,
        csDeficitEcts: 0,
        theoreticalDeficitEcts: 0,
        totalDeficitEcts: 0,
      },
      summaryMessage: 'No hard prerequisite credit barriers required for this program.',
      isEligibleForAdmission: true,
    };
  }

  // If user did not provide any credit inputs, evaluate as grace pass (unspecified)
  if (
    (student.mathCredits === undefined || student.mathCredits === null) &&
    (student.csCredits === undefined || student.csCredits === null) &&
    (student.theoreticalCredits === undefined || student.theoreticalCredits === null)
  ) {
    return {
      status: 'PREREQUISITES_SATISFIED',
      normalizedStudentCredits: {
        mathEcts: 0,
        csEcts: 0,
        theoreticalEcts: 0,
        scaleUsed: scale,
      },
      deficits: {
        mathDeficitEcts: 0,
        csDeficitEcts: 0,
        theoreticalDeficitEcts: 0,
        totalDeficitEcts: 0,
      },
      summaryMessage: 'Credit background not specified; evaluated based on GPA & standard admissions guidelines.',
      isEligibleForAdmission: true,
    };
  }

  const studentMathEcts = convertToEcts(student.mathCredits, scale);
  const studentCsEcts = convertToEcts(student.csCredits, scale);
  const studentTheoryEcts = convertToEcts(student.theoreticalCredits, scale);

  const mathDeficit = Math.max(0, reqMath - studentMathEcts);
  const csDeficit = Math.max(0, reqCs - studentCsEcts);
  const theoryDeficit = Math.max(0, reqTheory - studentTheoryEcts);
  const totalDeficit = Number((mathDeficit + csDeficit + theoryDeficit).toFixed(1));

  let status: 'PREREQUISITES_SATISFIED' | 'CONDITIONAL_BRIDGE_ELIGIBLE' | 'HARD_PREREQUISITE_DEFICIT' = 'PREREQUISITES_SATISFIED';
  let summaryMessage = 'All prerequisite credit requirements fully satisfied.';
  let isEligible = true;

  if (totalDeficit > 15) {
    status = 'HARD_PREREQUISITE_DEFICIT';
    summaryMessage = `Credit deficit of ${totalDeficit} ECTS exceeds conditional bridge capacity (Max 15 ECTS). Hard prerequisite disqualification.`;
    isEligible = false;
  } else if (totalDeficit > 0) {
    status = 'CONDITIONAL_BRIDGE_ELIGIBLE';
    summaryMessage = `Eligible for conditional admission with ${totalDeficit} ECTS in supplementary bridge courses during Semester 1.`;
    isEligible = true;
  }

  return {
    status,
    normalizedStudentCredits: {
      mathEcts: studentMathEcts,
      csEcts: studentCsEcts,
      theoreticalEcts: studentTheoryEcts,
      scaleUsed: scale,
    },
    deficits: {
      mathDeficitEcts: mathDeficit,
      csDeficitEcts: csDeficit,
      theoreticalDeficitEcts: theoryDeficit,
      totalDeficitEcts: totalDeficit,
    },
    summaryMessage,
    isEligibleForAdmission: isEligible,
  };
}
