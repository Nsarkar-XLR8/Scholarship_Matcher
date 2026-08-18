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
  targetField: string;
  targetDegree?: 'MASTERS' | 'MS' | 'MENG' | 'MBA';
  preferredCountryIsoCodes?: string[];
}

export interface MatchResult {
  normalizedGpa4Scale: number;
  matches: Array<{
    programId: string;
    programTitle: string;
    fieldOfStudy: string;
    universityName: string;
    domain: string;
    campusName: string;
    countryName: string;
    countryIsoCode: string;
    qualificationStatus: 'QUALIFIED' | 'REACH' | 'SAFETY';
    matchFitScorePct: number;
    requirements: {
      minGpa: number;
      minIelts: number | null;
      minGre: number | null;
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
  maxGpaRequirement?: number;
  limit?: number;
  offset?: number;
}

export const fetchTaxonomyTree = async () => {
  const res = await apiClient.get('/taxonomy/tree');
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

export const compareCountries = async (codes: string[], currency = 'USD') => {
  const res = await apiClient.get(`/comparison/countries?codes=${codes.join(',')}&currency=${currency}`);
  return res.data;
};
