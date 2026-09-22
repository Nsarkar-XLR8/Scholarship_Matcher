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
  matches: Array<{
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
  }>;
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
  requirements: {
    minGpa: number;
    minIelts: number | null;
    minToefl: number | null;
    minGre: number | null;
    workExpYearsRequired: number;
    requiresPapers: boolean;
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
