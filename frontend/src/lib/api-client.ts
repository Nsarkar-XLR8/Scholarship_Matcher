import axios from 'axios';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || '/api/v1';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Update baseURL on each request in browser environment
apiClient.interceptors.request.use((config) => {
  config.baseURL = getBaseUrl();
  return config;
});

// API Helper Interfaces
export interface MatchRequest {
  gpa: number;
  gpaScale?: number;
  ielts?: number;
  toefl?: number;
  gre?: number;
  papersCount?: number;
  workExpYears?: number;
  workExpRelevance?: 'DIRECT' | 'ADJACENT' | 'GENERAL';
  targetField: string;
  targetDegree?: 'MASTERS' | 'MS' | 'MENG' | 'MBA';
  preferredCountryIsoCodes?: string[];

  // Category A & C
  mathCredits?: number;
  csCredits?: number;
  theoryCredits?: number;
  creditScale?: 'ECTS' | 'US_SEMESTER' | 'INDIAN_SEMESTER' | 'UK_CATS';
  undergradTaughtInEnglish?: boolean;
  applicantCountryIsoCode?: string;
}

export interface PrerequisiteEvaluation {
  status: 'PREREQUISITES_SATISFIED' | 'CONDITIONAL_BRIDGE_ELIGIBLE' | 'HARD_PREREQUISITE_DEFICIT' | 'NOT_APPLICABLE';
  normalizedStudentCredits: {
    mathEcts: number;
    csEcts: number;
    theoreticalEcts: number;
    scaleUsed: string;
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

export interface MatchProgramItem {
  programId: string;
  programTitle: string;
  fieldOfStudy: string;
  universityName: string;
  domain: string;
  officialWebsiteUrl?: string;
  sourceUrl?: string;
  officialSourceUrl?: string;
  officialSourceProvider?: string;
  applicationDeadline?: string;
  intakeSeason?: string;
  tuitionFeeLocal?: number;
  currencyCode?: string;
  milestones?: {
    languageTestBy: string;
    documentLegalizationBy: string;
    portalSubmissionWindow: string;
    expectedDecisionDate: string;
    visaAppointmentBy: string;
  };
  campusName: string;
  campusCity?: string;
  latitude?: number;
  longitude?: number;
  countryName: string;
  countryIsoCode: string;
  qualificationStatus: 'QUALIFIED' | 'REACH' | 'SAFETY';
  matchFitScorePct: number;
  requirements: {
    minGpa: number;
    minIelts: number | null;
    minToefl?: number | null;
    minDuolingo?: number | null;
    minPte?: number | null;
    minGre: number | null;
    workExpYearsRequired?: number;
    requiresPapers: boolean;
    minMathEcts?: number;
    minCsEcts?: number;
    minTheoreticalEcts?: number;
    acceptsMoiEnglishWaiver?: boolean;
  };
  prerequisiteEvaluation?: PrerequisiteEvaluation;
  moiWaiver?: {
    acceptedByProgram: boolean;
    waiverApplied: boolean;
    note: string;
  };
  credentialVerification?: {
    apsRequired: boolean;
    anabinRecognition: string;
    uniAssistVpdRequired: boolean;
  };
  documentChecklist?: {
    sopMaxWords: number;
    lorAcademicCount: number;
    lorProfessionalCount: number;
    cvFormatRequired: string;
    portfolioRequired: boolean;
  };
  scholarshipOffer: {
    publishedRules: Array<{
      ruleId: string;
      title: string;
      scope: string;
      type: string;
      calculatedPct: number;
      confidence: 'VERIFIED' | 'SCRAPED_UNVERIFIED' | 'CROWDSOURCED';
      description: string | null;
      sourceUrl: string;
      officialSourceUrl?: string;
      officialSourceProvider?: string;
    }>;
    crowdsourcedDistribution: {
      reportCount: number;
      p25ScholarshipPct: number;
      medianScholarshipPct: number;
      p75ScholarshipPct: number;
    } | null;
  };
}

export interface MatchResult {
  normalizedGpa4Scale: number;
  effectiveGpa4Scale?: number;
  workExperienceCompensation?: {
    originalNormalizedGpa: number;
    effectiveGpa: number;
    gpaBoost: number;
    yearsExp: number;
    relevance: 'DIRECT' | 'ADJACENT' | 'GENERAL';
  };
  matches: MatchProgramItem[];
}

export interface SearchRequest {
  query?: string;
  countryIsoCode?: string;
  fieldOfStudy?: string;
  degreeLevel?: string;
  maxGpaRequirement?: number;
  maxIeltsRequirement?: number;
  hasVerifiedScholarshipOnly?: boolean;
  sortBy?: 'relevance' | 'tuition_asc' | 'tuition_desc' | 'title_asc';
  limit?: number;
  offset?: number;
}

export interface TreeProgram {
  id: string;
  title: string;
  fieldOfStudy: string;
  degreeLevel: string;
  durationMonths: number;
  language: string;
  tuitionFeeLocal: number;
  currencyCode: string;
  sourceUrl: string;
  officialSourceUrl?: string | null;
  officialSourceProvider?: string;
  applicationDeadline?: string | null;
  intakeSeason?: string | null;
  universityId: string;
  universityName: string;
  domain: string;
  campusName?: string;
  campusCity?: string;
  latitude?: number;
  longitude?: number;
  requirements: {
    minGpa: number;
    minIelts: number | null;
    minToefl: number | null;
    minGre: number | null;
    workExpYearsRequired: number;
    requiresPapers: boolean;
    minMathEcts?: number;
    minCsEcts?: number;
    minTheoreticalEcts?: number;
    acceptsMoiEnglishWaiver?: boolean;
  };
  documentChecklist?: {
    sopMaxWords: number;
    lorAcademicCount: number;
    lorProfessionalCount: number;
    cvFormatRequired: string;
    portfolioRequired: boolean;
  };
  scholarshipRules: Array<{
    id: string;
    title: string;
    scope: string;
    type: string;
    coveragePct: number;
    officialSourceUrl?: string | null;
  }>;
}

export interface TreeCountry {
  id: string;
  isoCode: string;
  iso3Code: string;
  name: string;
  currencyCode: string;
  avgTuitionMinUsd: number;
  avgTuitionMaxUsd: number;
  estMonthlyLivingCostUsd: number;
  dataCompletenessPct: number;
  postStudyWorkVisa: {
    visaName: string;
    durationMonths: number;
    stayBackFormatted: string;
    inStudyHoursPerWeek: number;
    pathwayToPermanentRes: string;
    medianGraduateSalaryUsd: number;
    monthlyBlockedAccountLocal?: number;
    blockedAccountCurrency?: string;
    proofOfFundsMonths?: number;
    requiresApsCertificate?: boolean;
    anabinRecognitionType?: string;
    uniAssistVpdRequired?: boolean;
  };
  stats: {
    programCount: number;
    universityCount: number;
    maxScholarshipCoveragePct: number;
    verifiedScholarshipsCount: number;
  };
  universities: Array<{
    id: string;
    name: string;
    domain: string;
    rankingQs?: number | null;
    programs: TreeProgram[];
  }>;
  allPrograms: TreeProgram[];
}

export interface TreeRegion {
  id: string;
  code: string;
  name: string;
  totalPrograms: number;
  countries: TreeCountry[];
}

export interface TreeContinent {
  id: string;
  code: string;
  name: string;
  unM49Code: string;
  stats: {
    totalPrograms: number;
    totalUniversities: number;
    countriesCount: number;
    minTuitionUsd: number;
    maxTuitionUsd: number;
    hasFullRideScholarships: boolean;
  };
  regions: TreeRegion[];
}

export interface UNGeographicProgramTreeResponse {
  continents: TreeContinent[];
  metadata: {
    totalGlobalPrograms: number;
    totalGlobalUniversities: number;
    totalGlobalCountries: number;
    generatedAt: string;
    source: string;
  };
}

export interface CountryIndustryIntelligence {
  studentMinWageHourlyLocal: number;
  minWageCurrency: string;
  studentMinWageHourlyConverted: number;
  inStudyWorkLimitFormatted: string;
  taxFreeAllowanceAnnualLocal: number;
  spousalWorkRightsPolicy: string;
  spouseWorkAllowed: boolean;
  permanentResidencyPathway: string;
  prTimelineYears: number;
  mandatoryHealthcareMonthlyLocal: number;
  mandatoryHealthcareMonthlyConverted: number;
  healthcareCurrency: string;
  englishProficiencyRank: string;
  housingStrainIndex: 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface CountryComparisonItem {
  isoCode: string;
  countryName: string;
  regionName: string;
  continentName: string;
  nativeCurrency: string;
  displayCurrency: string;
  tuitionRangeAnnual: {
    min: number;
    max: number;
  };
  estMonthlyLivingCost: number;
  universitiesCount: number;
  countryScholarshipsCount: number;
  dataCompletenessPct: number;
  visaAndWorkProfile?: {
    postStudyWorkMonths: number;
    permitName: string;
    inStudyWorkHoursWeekly: number;
    allowsSpouseWork: boolean;
    pathwayToPR: string;
    medianGraduateSalary: number;
    totalEstimatedInvestment2Yr: number;
    estimatedPaybackYears: number;
    monthlyBlockedAccountLocal: number;
    blockedAccountCurrency: string;
    requiresApsCertificate: boolean;
    anabinRecognitionType: string;
  } | null;
  industryIntelligence: CountryIndustryIntelligence;
}

export interface StatutoryProofOfFundsItem {

  countryIsoCode: string;
  countryName: string;
  nativeCurrency: string;
  displayCurrency: string;
  statutoryMonthlyLocal: number;
  statutoryAnnualLocal: number;
  statutoryMonthlyConverted: number;
  statutoryAnnualConverted: number;
  mandatoryInsuranceBufferConverted: number;
  recommendedFxBufferConverted: number;
  totalStatutoryDepositRequired: number;
  durationMonthsRequired: number;
  permitRegulationName: string;
  netBlockedDepositAfterScholarship?: {
    scholarshipAnnualStipend: number;
    netBlockedDepositRequired: number;
    isFullyWaivedByScholarship: boolean;
  };
}

export interface LoanEstimationResult {
  universityRanking: number;
  degreeLevel: string;
  isEligibleForNoCosignerLoan: boolean;
  lenderOptions: string[];
  maxEstimatedBorrowingCapacityUsd: number;
  estimatedInterestRatePct: number;
  estimatedMonthlyRepayment10YrUsd: number;
  totalRepayment10YrUsd: number;
  summary: string;
}

export interface OutcomeDistributionItem {
  programId: string;
  programTitle: string;
  degreeLevel: string;
  fieldOfStudy: string;
  universityName: string;
  domain: string;
  countryName: string;
  countryIsoCode: string;
  tuitionFeeLocal: number;
  currencyCode: string;
  officialScholarshipCount: number;
  stats: {
    totalVerifiedReports: number;
    p25ScholarshipPct: number;
    medianScholarshipPct: number;
    p75ScholarshipPct: number;
    avgAdmittedGpa: number;
    minAdmittedGpa: number;
    maxAdmittedGpa: number;
    avgAdmittedIelts: number | null;
    avgAdmittedGre: number | null;
    mostCommonCycleYear: number;
  };
  recentReports: Array<{
    gpa: number;
    ielts: number | null;
    gre: number | null;
    scholarshipPct: number;
    cycleYear: number;
    createdAt: string;
  }>;
}

export interface OutcomeDistributionsResponse {
  total: number;
  items: OutcomeDistributionItem[];
  generatedAt: string;
}

export interface OutcomeGlobalStats {
  totalVerifiedReports: number;
  totalFlaggedOutliers: number;
  outlierFilteredRatePct: number;
  globalMedianScholarshipPct: number;
  topYieldDestinations: Array<{
    countryName: string;
    isoCode: string;
    averageYieldPct: number;
    reportsCount: number;
  }>;
  generatedAt: string;
}

export const fetchTaxonomyTree = async () => {
  const res = await apiClient.get('/taxonomy/tree');
  return res.data;
};

export const fetchGeographicProgramsTree = async (params?: {
  query?: string;
  fieldOfStudy?: string;
  degreeLevel?: string;
  continentCode?: string;
  countryIsoCode?: string;
  maxGpa?: number;
  hasScholarshipOnly?: boolean;
}): Promise<UNGeographicProgramTreeResponse> => {
  const res = await apiClient.get('/taxonomy/programs-tree', { params });
  return res.data;
};

export const fetchCountries = async () => {
  const res = await apiClient.get('/taxonomy/countries');
  return res.data;
};

export const fetchCountryByIsoCode = async (isoCode: string) => {
  const res = await apiClient.get(`/taxonomy/countries/${isoCode}`);
  return res.data;
};

export const evaluateProfileMatch = async (data: MatchRequest): Promise<MatchResult> => {
  const res = await apiClient.post('/match', data);
  return res.data;
};

export const searchPrograms = async (data: SearchRequest) => {
  const res = await apiClient.post('/search/programs', data);
  return res.data;
};

export const fetchProgramDetails = async (programId: string) => {
  const res = await apiClient.get(`/programs/${programId}`);
  return res.data;
};

export const submitOutcomeReport = async (reportData: {
  programId: string;
  reportedGpa: number;
  reportedGpaScale?: number;
  reportedIelts?: number;
  reportedGre?: number;
  scholarshipPctReceived: number;
  admitCycleYear: number;
}) => {
  const res = await apiClient.post('/outcomes/report', reportData);
  return res.data;
};

export const fetchOutcomeDistributions = async (params?: {
  countryIsoCode?: string;
  fieldOfStudy?: string;
  cycleYear?: number;
  minScholarshipPct?: number;
  query?: string;
}): Promise<OutcomeDistributionsResponse> => {
  const res = await apiClient.get('/outcomes/distributions', { params });
  return res.data;
};

export const fetchOutcomeStats = async (): Promise<OutcomeGlobalStats> => {
  const res = await apiClient.get('/outcomes/stats');
  return res.data;
};

export const compareCountries = async (codes: string[], currency = 'USD') => {
  const res = await apiClient.get(`/comparison/countries?codes=${codes.join(',')}&currency=${currency}`);
  return res.data;
};

export const fetchProofOfFundsMatrix = async (
  codes: string[] = ['DE', 'NL', 'GB', 'US', 'MY', 'CA', 'AU', 'SE', 'SG', 'FR'],
  currency = 'USD',
  scholarshipAnnualAward = 0
): Promise<StatutoryProofOfFundsItem[]> => {
  const res = await apiClient.get(
    `/comparison/proof-of-funds?codes=${codes.join(',')}&currency=${currency}&scholarshipAnnualAward=${scholarshipAnnualAward}`
  );
  return res.data;
};

export const fetchLoanEstimate = async (
  tuitionUsd = 35000,
  qsRanking = 50,
  degreeLevel = 'MS',
  fieldOfStudy = 'Computer Science'
): Promise<LoanEstimationResult> => {
  const res = await apiClient.get(
    `/comparison/loans?tuitionUsd=${tuitionUsd}&qsRanking=${qsRanking}&degreeLevel=${degreeLevel}&fieldOfStudy=${encodeURIComponent(fieldOfStudy)}`
  );
  return res.data;
};
