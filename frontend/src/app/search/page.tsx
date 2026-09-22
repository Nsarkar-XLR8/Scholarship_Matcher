'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Globe,
  BookOpen,
  Award,
  CheckCircle,
  RefreshCw,
  Layers,
  X,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  GraduationCap,
  DollarSign,
  Calendar,
  ArrowRight,
  Sparkles,
  MapPin,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Building2,
  Sliders,
  ShieldCheck,
  Check,
  Pin,
  LayoutGrid,
  ListTree,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchableSelect, { SelectOption } from '@/components/common/SearchableSelect';
import { 
  searchPrograms, 
  fetchGeographicProgramsTree, 
  UNGeographicProgramTreeResponse,
  TreeContinent,
  TreeRegion,
  TreeCountry,
  TreeProgram
} from '@/lib/api-client';
import { useToast } from '@/components/common/ToastProvider';
import { formatOfficialUrl } from '@/lib/url-formatter.util';
import { useShortlist } from '@/context/ShortlistContext';
import ROICalculatorModal from '@/components/common/ROICalculatorModal';

const COUNTRY_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Countries (Global)', icon: '🌐' },
  { value: 'DE', label: 'Germany', sublabel: 'Europe (Western Europe)', icon: '🇩🇪' },
  { value: 'NL', label: 'Netherlands', sublabel: 'Europe (Western Europe)', icon: '🇳🇱' },
  { value: 'GB', label: 'United Kingdom', sublabel: 'Europe (Northern Europe)', icon: '🇬🇧' },
  { value: 'US', label: 'United States', sublabel: 'North America', icon: '🇺🇸' },
  { value: 'CA', label: 'Canada', sublabel: 'North America', icon: '🇨🇦' },
  { value: 'AU', label: 'Australia', sublabel: 'Oceania (Australia & NZ)', icon: '🇦🇺' },
  { value: 'SE', label: 'Sweden', sublabel: 'Europe (Northern Europe)', icon: '🇸🇪' },
  { value: 'SG', label: 'Singapore', sublabel: 'Asia (South-Eastern Asia)', icon: '🇸🇬' },
  { value: 'FR', label: 'France', sublabel: 'Europe (Western Europe)', icon: '🇫🇷' },
  { value: 'MY', label: 'Malaysia', sublabel: 'Asia (South-Eastern Asia)', icon: '🇲🇾' },
];

const FIELD_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Fields of Study', icon: '🎓' },
  { value: 'Computer Science', label: 'Computer Science', sublabel: 'STEM / Technology' },
  { value: 'Data Science', label: 'Data Science & Artificial Intelligence', sublabel: 'STEM / Analytics' },
  { value: 'Electrical Engineering', label: 'Electrical Engineering', sublabel: 'Engineering' },
  { value: 'Biomedical Engineering', label: 'Biomedical Engineering', sublabel: 'Life Sciences / Engineering' },
  { value: 'Business Analytics', label: 'Business Analytics & Finance', sublabel: 'Business / Finance' },
  { value: 'Public Policy', label: 'Public Policy & Governance', sublabel: 'Social Sciences' },
  { value: 'Mechanical Engineering', label: 'Mechanical & Automotive', sublabel: 'Engineering' },
  { value: 'Environmental Science', label: 'Environmental & Energy', sublabel: 'Sustainability' },
];

const DEGREE_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Degrees (MS, MEng, MBA)', icon: '📜' },
  { value: 'MS', label: 'Master of Science (M.Sc. / MS)', sublabel: 'Research & Technical' },
  { value: 'MENG', label: 'Master of Engineering (M.Eng.)', sublabel: 'Applied Engineering' },
  { value: 'MBA', label: 'Master of Business Admin (MBA)', sublabel: 'Management & Strategy' },
  { value: 'MASTERS', label: 'General Masters (M.A. / M.S.)', sublabel: 'Interdisciplinary' },
];

const SORT_OPTIONS: SelectOption[] = [
  { value: 'relevance', label: 'Relevance / Recommended', icon: '✨' },
  { value: 'tuition_asc', label: 'Tuition: Low to High', icon: '💰' },
  { value: 'tuition_desc', label: 'Tuition: High to Low', icon: '💎' },
  { value: 'title_asc', label: 'Program Title: A to Z', icon: '🔤' },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { isShortlisted, toggleShortlist } = useShortlist();

  // Active View Mode: 'geography' (UN M49 Hierarchy) vs 'grid' (Faceted Search) vs 'map' (Interactive Global Map)
  const [viewMode, setViewMode] = useState<'geography' | 'grid' | 'map'>(
    (searchParams.get('view') as 'geography' | 'grid' | 'map') || 'geography'
  );

  // Filters State
  const [query, setQuery] = useState<string>(searchParams.get('q') || searchParams.get('query') || '');
  const [countryIsoCode, setCountryIsoCode] = useState<string>(
    searchParams.get('country') || searchParams.get('countryIsoCode') || ''
  );
  const [continentCode, setContinentCode] = useState<string>(searchParams.get('continent') || 'EU');
  const [fieldOfStudy, setFieldOfStudy] = useState<string>(
    searchParams.get('field') || searchParams.get('fieldOfStudy') || ''
  );
  const [degreeLevel, setDegreeLevel] = useState<string>(searchParams.get('degree') || '');
  const [maxGpa, setMaxGpa] = useState<number>(Number(searchParams.get('maxGpa')) || 4.0);
  const [hasScholarshipOnly, setHasScholarshipOnly] = useState<boolean>(
    searchParams.get('hasScholarship') === 'true'
  );
  const [sortBy, setSortBy] = useState<string>('relevance');

  // Selected Map Pin State
  const [selectedMapPin, setSelectedMapPin] = useState<any | null>(null);

  // Data State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [geoTree, setGeoTree] = useState<UNGeographicProgramTreeResponse | null>(null);
  const [isLoadingTree, setIsLoadingTree] = useState<boolean>(false);

  // Modal States
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [selectedRoiProgram, setSelectedRoiProgram] = useState<any | null>(null);

  // 1. Load UN Geographic Programs Tree
  const loadGeoTree = useCallback(async () => {
    setIsLoadingTree(true);
    try {
      const data = await fetchGeographicProgramsTree({
        query: query || undefined,
        fieldOfStudy: fieldOfStudy || undefined,
        degreeLevel: degreeLevel || undefined,
        continentCode: continentCode || undefined,
        countryIsoCode: countryIsoCode || undefined,
        maxGpa: maxGpa < 4.0 ? maxGpa : undefined,
        hasScholarshipOnly: hasScholarshipOnly ? true : undefined,
      });
      setGeoTree(data);
    } catch (err) {
      console.error('Failed to load geographic tree:', err);
    } finally {
      setIsLoadingTree(false);
    }
  }, [query, fieldOfStudy, degreeLevel, continentCode, countryIsoCode, maxGpa, hasScholarshipOnly]);

  // 2. Load Faceted Grid Search Results
  const handleFacetedSearch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await searchPrograms({
        query: query || undefined,
        countryIsoCode: countryIsoCode ? countryIsoCode.toUpperCase() : undefined,
        fieldOfStudy: fieldOfStudy || undefined,
        degreeLevel: degreeLevel || undefined,
        maxGpaRequirement: maxGpa < 4.0 ? maxGpa : undefined,
        hasVerifiedScholarshipOnly: hasScholarshipOnly ? true : undefined,
        sortBy: sortBy as any,
        limit: 50,
      });
      setSearchResults(data);
    } catch (error) {
      console.error('Faceted search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [query, countryIsoCode, fieldOfStudy, degreeLevel, maxGpa, hasScholarshipOnly, sortBy]);

  // Sync and trigger searches
  useEffect(() => {
    const timer = setTimeout(() => {
      if (viewMode === 'geography' || viewMode === 'map') {
        loadGeoTree();
      }
      if (viewMode === 'grid' || viewMode === 'map') {
        handleFacetedSearch();
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [viewMode, loadGeoTree, handleFacetedSearch]);

  const clearAllFilters = () => {
    setQuery('');
    setCountryIsoCode('');
    setFieldOfStudy('');
    setDegreeLevel('');
    setMaxGpa(4.0);
    setHasScholarshipOnly(false);
    setSortBy('relevance');
    showToast('Filters Cleared', 'Reset to all global master’s programs', 'info');
  };

  const activeFiltersCount =
    (query ? 1 : 0) +
    (countryIsoCode ? 1 : 0) +
    (fieldOfStudy ? 1 : 0) +
    (degreeLevel ? 1 : 0) +
    (maxGpa < 4.0 ? 1 : 0) +
    (hasScholarshipOnly ? 1 : 0);

  // Active continent from geo tree
  const activeContinentData =
    geoTree?.continents?.find((c) => c.code === continentCode) || geoTree?.continents?.[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      {/* Header with Title & Mode Switcher */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-royal text-xs font-mono font-semibold mb-4 shadow-sm">
          <Globe className="w-3.5 h-3.5 text-royal" />
          UN M49 Standard Geographic Program Explorer
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-outfit text-slate-navy mb-3">
          Explore Global Master’s Programs
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Discover, compare, and filter verified master's degree programs across 10 global destinations, structured under UN M49 geography with verified scholarships, work rights, and real-time eligibility parameters.
        </p>

        {/* View Mode Toggle */}
        <div className="flex justify-center mt-6">
          <div className="inline-flex flex-wrap items-center justify-center p-1.5 rounded-2xl bg-slate-100 border border-slate-200 shadow-inner gap-1">
            <button
              type="button"
              onClick={() => setViewMode('geography')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === 'geography'
                  ? 'bg-gradient-to-r from-blue-600 to-royal text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-royal'
              }`}
            >
              <ListTree className="w-4 h-4" />
              <span>UN Geographic Hierarchy</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-blue-600 to-royal text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-royal'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Faceted Search Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === 'map'
                  ? 'bg-gradient-to-r from-blue-600 to-royal text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-royal'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Global Map View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 mb-8 space-y-5 shadow-xl">
        {/* Main Search Input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keyword, university name (e.g. TUM, Oxford, Toronto, Delft), or degree title..."
              className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-10 py-3.5 text-sm text-slate-900 font-semibold focus:border-royal focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => (viewMode === 'geography' ? loadGeoTree() : handleFacetedSearch())}
            disabled={isLoading || isLoadingTree}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-royal text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-500/25 hover:scale-105 transition-transform shrink-0 flex items-center justify-center gap-2"
          >
            {isLoading || isLoadingTree ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Search</span>
          </button>
        </div>

        {/* Facet Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
          <SearchableSelect
            options={COUNTRY_OPTIONS}
            value={countryIsoCode}
            onChange={(val) => setCountryIsoCode(val)}
            label="Country Destination"
            placeholder="All Destinations..."
            searchPlaceholder="Search country..."
            icon={<Globe className="w-4 h-4" />}
          />

          <SearchableSelect
            options={FIELD_OPTIONS}
            value={fieldOfStudy}
            onChange={(val) => setFieldOfStudy(val)}
            label="Field of Study"
            placeholder="All Disciplines..."
            searchPlaceholder="Search field..."
            icon={<BookOpen className="w-4 h-4" />}
          />

          <SearchableSelect
            options={DEGREE_OPTIONS}
            value={degreeLevel}
            onChange={(val) => setDegreeLevel(val)}
            label="Degree Level"
            placeholder="All Degrees (MS/MBA)..."
            searchPlaceholder="Filter degree..."
            icon={<GraduationCap className="w-4 h-4" />}
          />

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-700">Max GPA Requirement</label>
              <span className="font-mono font-bold text-royal">{maxGpa.toFixed(1)} / 4.0</span>
            </div>
            <input
              type="range"
              min="2.5"
              max="4.0"
              step="0.1"
              value={maxGpa}
              onChange={(e) => setMaxGpa(parseFloat(e.target.value))}
              className="w-full accent-royal h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block font-mono">Filters out higher threshold bars</span>
          </div>
        </div>

        {/* Secondary Toggles & Quick Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setHasScholarshipOnly(!hasScholarshipOnly)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                hasScholarshipOnly
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Scholarships Only</span>
              {hasScholarshipOnly && <Check className="w-3 h-3 text-emerald-600" />}
            </button>

            {viewMode === 'grid' && (
              <div className="w-56">
                <SearchableSelect
                  options={SORT_OPTIONS}
                  value={sortBy}
                  onChange={(val) => setSortBy(val)}
                  placeholder="Sort results..."
                  icon={<Sliders className="w-3.5 h-3.5" />}
                />
              </div>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-royal font-bold hover:underline font-mono text-xs flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear {activeFiltersCount} Active Filter{activeFiltersCount > 1 ? 's' : ''}</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE A: UN GEOGRAPHIC HIERARCHY EXPLORER */}
      {/* ========================================================================= */}
      {viewMode === 'geography' && (
        <div className="space-y-8">
          {/* Continent Navigation Tabs */}
          {geoTree?.continents && (
            <div className="flex justify-center gap-2 overflow-x-auto pb-2">
              {geoTree.continents.map((continent) => (
                <button
                  key={continent.id}
                  onClick={() => setContinentCode(continent.code)}
                  className={`px-6 py-3 rounded-2xl text-xs font-bold font-outfit tracking-wide transition-all whitespace-nowrap flex items-center gap-2 ${
                    continentCode === continent.code
                      ? 'bg-gradient-to-r from-blue-600 to-royal text-white shadow-md shadow-blue-500/20 scale-105'
                      : 'glass-panel border-slate-200 text-slate-700 hover:text-royal hover:bg-slate-50'
                  }`}
                >
                  <span>{continent.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    continentCode === continent.code ? 'bg-white/20 text-white' : 'bg-blue-50 text-royal'
                  }`}>
                    {continent.stats.totalPrograms} Programs
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Active Continent Overview Card */}
          {activeContinentData && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-navy to-blue-950 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-blue-200 border border-white/20">
                    UN M49 Code: {activeContinentData.unM49Code}
                  </span>
                  {activeContinentData.stats.hasFullRideScholarships && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                      <Award className="w-3 h-3" /> Full-Ride Available
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold font-outfit text-white">
                  {activeContinentData.name} Higher Education Ecosystem
                </h2>
                <p className="text-xs text-slate-300">
                  {activeContinentData.stats.totalPrograms} verified programs across {activeContinentData.stats.totalUniversities} leading universities in {activeContinentData.regions.length} geographic regions.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono bg-white/5 p-3 rounded-2xl border border-white/10">
                <div>
                  <span className="text-slate-400 block text-[10px]">Tuition Range:</span>
                  <strong className="text-white">
                    ${activeContinentData.stats.minTuitionUsd.toLocaleString()} - ${activeContinentData.stats.maxTuitionUsd.toLocaleString()}/yr
                  </strong>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Active Tracked:</span>
                  <strong className="text-royal font-bold bg-white px-2 py-0.5 rounded text-blue-900">
                    {activeContinentData.stats.totalPrograms} Programs
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Regional Groups & Country Program Catalogs */}
          {isLoadingTree ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-royal border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-slate-500">Loading UN M49 Geographic Program Hierarchy...</p>
            </div>
          ) : activeContinentData?.regions.map((region) => (
            <div key={region.id} className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-xl font-bold font-outfit text-slate-navy flex items-center gap-2">
                  <Layers className="w-5 h-5 text-royal" />
                  <span>{region.name} Region</span>
                </h3>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {region.totalPrograms} Programs in {region.countries.length} Destinations
                </span>
              </div>

              {/* Countries Grid */}
              <div className="grid grid-cols-1 gap-8">
                {region.countries.map((country) => (
                  <div
                    key={country.id}
                    className="glass-panel rounded-3xl border border-slate-200 overflow-hidden shadow-lg space-y-6 p-6 sm:p-8 bg-white"
                  >
                    {/* Country Header & Work/Visa Meta */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-2xl font-extrabold font-outfit text-slate-navy">
                            {country.name}
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-royal border border-blue-200">
                            ISO: {country.isoCode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono">
                          Native Currency: <strong>{country.currencyCode}</strong> • Est. Living: <strong>${country.estMonthlyLivingCostUsd}/mo</strong> • Data Coverage: <strong>{country.dataCompletenessPct}%</strong>
                        </p>
                      </div>

                      {/* Post-Study Work Rights Badge */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl text-xs font-mono">
                          <span className="text-slate-500 block text-[10px]">Post-Study Stayback:</span>
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5" />
                            {country.postStudyWorkVisa.stayBackFormatted} ({country.postStudyWorkVisa.visaName})
                          </span>
                        </div>

                        <a
                          href={`/comparison?countries=${country.isoCode}`}
                          className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <span>Visa Studio</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Programs in this Country */}
                    {country.allPrograms.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs font-mono text-slate-500">
                        No programs match the active filter criteria in {country.name}.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {country.allPrograms.map((prog) => {
                          const shortlisted = isShortlisted(prog.id);

                          return (
                            <div
                              key={prog.id}
                              className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-royal hover:bg-white transition-all shadow-sm flex flex-col justify-between space-y-4 group"
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-royal border border-blue-100">
                                    {prog.fieldOfStudy}
                                  </span>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-slate-600 font-bold border border-slate-200">
                                    {prog.degreeLevel}
                                  </span>
                                </div>

                                <h5 className="text-sm font-bold font-outfit text-slate-navy group-hover:text-royal transition-colors line-clamp-2">
                                  {prog.title}
                                </h5>

                                <div className="text-xs text-slate-600 flex items-center gap-1 font-medium">
                                  <Building2 className="w-3.5 h-3.5 text-royal flex-shrink-0" />
                                  <span className="truncate">{prog.universityName}</span>
                                </div>

                                <div className="space-y-1 text-[11px] font-mono bg-white p-2.5 rounded-xl border border-slate-200">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Tuition:</span>
                                    <strong className="text-slate-900">
                                      {prog.tuitionFeeLocal ? `${prog.currencyCode} ${prog.tuitionFeeLocal.toLocaleString()}` : 'Tuition Free / €0'}
                                    </strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Min Bar:</span>
                                    <strong className="text-royal">
                                      {prog.requirements.minGpa ? `GPA ${prog.requirements.minGpa.toFixed(1)}/4.0` : 'Holistic'}
                                      {prog.requirements.minIelts ? ` • IELTS ${prog.requirements.minIelts}` : ''}
                                    </strong>
                                  </div>
                                </div>

                                {prog.scholarshipRules.length > 0 && (
                                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                                    <Award className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="truncate font-semibold">
                                      {prog.scholarshipRules[0].title} ({prog.scholarshipRules[0].coveragePct}% Coverage)
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Card Action Buttons */}
                              <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    toggleShortlist({
                                      programId: prog.id,
                                      programTitle: prog.title,
                                      universityName: prog.universityName,
                                      domain: prog.domain,
                                      countryName: country.name,
                                      countryIsoCode: country.isoCode,
                                      fieldOfStudy: prog.fieldOfStudy,
                                      tuitionFeeLocal: prog.tuitionFeeLocal,
                                      currencyCode: prog.currencyCode,
                                      qualificationStatus: 'QUALIFIED',
                                      matchFitScorePct: 95,
                                      requirements: {
                                        minGpa: prog.requirements.minGpa,
                                        minIelts: prog.requirements.minIelts,
                                        minToefl: prog.requirements.minToefl,
                                        minGre: prog.requirements.minGre,
                                        workExpYearsRequired: prog.requirements.workExpYearsRequired,
                                        requiresPapers: prog.requirements.requiresPapers,
                                      },
                                    });
                                  }}
                                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-colors ${
                                    shortlisted
                                      ? 'bg-blue-50 text-royal border-blue-200 font-bold'
                                      : 'bg-white text-slate-700 border-slate-200 hover:border-royal hover:text-royal'
                                  }`}
                                >
                                  {shortlisted ? (
                                    <>
                                      <Check className="w-3 h-3 text-royal" />
                                      <span>Pinned</span>
                                    </>
                                  ) : (
                                    <>
                                      <Pin className="w-3 h-3" />
                                      <span>Pin</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedRoiProgram({
                                    ...prog,
                                    countryName: country.name,
                                    tuitionFeeLocal: prog.tuitionFeeLocal,
                                  })}
                                  className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                                  title="Calculate Career ROI & Foregone Salary"
                                >
                                  <TrendingUp className="w-3.5 h-3.5 text-royal" />
                                  <span>ROI</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedProgram({
                                    ...prog,
                                    countryName: country.name,
                                    countryIsoCode: country.isoCode,
                                  })}
                                  className="py-1.5 px-2.5 rounded-xl bg-royal hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                                >
                                  <span>Details</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE C: INTERACTIVE GLOBAL MAP VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'map' && (
        <div className="space-y-6">
          {/* Map Header & Info */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-navy to-blue-950 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Interactive Geospatial University Explorer
              </span>
              <h2 className="text-2xl font-bold font-outfit text-white mt-1">
                Global Campus Hubs & Geographic Distribution
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Explore worldwide campuses with exact geographic coordinates, local tuition benchmarks, and post-study stayback terms.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono bg-white/5 p-3 rounded-2xl border border-white/10">
              <span className="text-slate-400">Hubs Active:</span>
              <strong className="text-emerald-400">10 International Destinations</strong>
            </div>
          </div>

          {/* Interactive World Grid & Map Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Campus Hubs Map Grid */}
            <div className="lg:col-span-8 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden min-h-[480px] flex flex-col justify-between">
              {/* Stylized Geospatial Grid Background */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
              
              <div className="relative z-10 flex justify-between items-center pb-4 border-b border-slate-800/80">
                <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-royal" /> Top Geographic Destination Clusters
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Click any hub to inspect local universities & programs
                </span>
              </div>

              {/* Geographic Hub Clusters */}
              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
                {[
                  { name: 'Munich & Bavaria', country: 'Germany', code: 'DE', lat: 48.1497, lng: 11.5680, tuition: '€0 - €6,000/yr', stayback: '18 Months', unis: ['TUM', 'LMU Munich'] },
                  { name: 'Oxford & London Hub', country: 'United Kingdom', code: 'GB', lat: 51.7548, lng: -1.2544, tuition: '£28k - £45k/yr', stayback: '24 Months', unis: ['Oxford', 'Imperial', 'UCL'] },
                  { name: 'Delft & Randstad', country: 'Netherlands', code: 'NL', lat: 52.0021, lng: 4.3705, tuition: '€20,500/yr', stayback: '12 Months (Zoekjaar)', unis: ['TU Delft', 'Univ of Amsterdam'] },
                  { name: 'Toronto & Ontario', country: 'Canada', code: 'CA', lat: 43.6629, lng: -79.3957, tuition: 'CAD $42,000/yr', stayback: 'Up to 3 Years (PGWP)', unis: ['Univ of Toronto', 'Waterloo'] },
                  { name: 'California & East Coast', country: 'United States', code: 'US', lat: 37.4275, lng: -122.1697, tuition: '$45k - $60k/yr', stayback: '36 Months (STEM OPT)', unis: ['Stanford', 'CMU', 'MIT'] },
                  { name: 'Stockholm & Nordic', country: 'Sweden', code: 'SE', lat: 59.3498, lng: 18.0707, tuition: 'SEK 160,000/yr', stayback: '12 Months', unis: ['KTH Royal Institute', 'Lund'] },
                  { name: 'Singapore Hub', country: 'Singapore', code: 'SG', lat: 1.2966, lng: 103.7764, tuition: 'SGD 45,000/yr', stayback: '12 Months (LTVP)', unis: ['NUS', 'NTU Singapore'] },
                  { name: 'Melbourne & Sydney', country: 'Australia', code: 'AU', lat: -37.7982, lng: 144.9610, tuition: 'AUD $48,000/yr', stayback: '24 - 36 Months', unis: ['Univ of Melbourne', 'UNSW'] },
                  { name: 'Paris Region', country: 'France', code: 'FR', lat: 48.7128, lng: 2.2084, tuition: '€3,770 - €18,000/yr', stayback: '12 Months (APS/RECE)', unis: ['Institut Polytechnique', 'Sorbonne'] },
                ].map((hub) => {
                  const isSelected = selectedMapPin?.name === hub.name;
                  return (
                    <button
                      key={hub.name}
                      type="button"
                      onClick={() => {
                        setSelectedMapPin(hub);
                        setCountryIsoCode(hub.code);
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-blue-600/30 border-blue-400 shadow-lg shadow-blue-500/20 text-white'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-mono font-bold text-royal bg-blue-500/20 px-2 py-0.5 rounded text-blue-300">
                          {hub.code}
                        </span>
                        <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                      </div>
                      <h4 className="text-xs font-bold font-outfit text-white leading-tight">{hub.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">{hub.country}</p>
                      <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between">
                        <span>Stayback:</span>
                        <strong className="text-emerald-400">{hub.stayback}</strong>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="relative z-10 pt-3 border-t border-slate-800/80 flex justify-between items-center text-[11px] font-mono text-slate-400">
                <span>Coordinates Reference: WGS 84 Projection</span>
                <span className="text-royal font-semibold">100% Stateless Zero-Auth Platform</span>
              </div>
            </div>

            {/* Right: Selected Hub Programs Inspector */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-outfit text-slate-navy flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-royal" />
                    <span>{selectedMapPin ? selectedMapPin.name : 'All Destination Hubs'}</span>
                  </h3>
                  {selectedMapPin && (
                    <button
                      onClick={() => {
                        setSelectedMapPin(null);
                        setCountryIsoCode('');
                      }}
                      className="text-[10px] font-mono text-slate-400 hover:text-royal underline"
                    >
                      Reset Hub
                    </button>
                  )}
                </div>

                {selectedMapPin ? (
                  <div className="space-y-2 text-xs font-mono bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Destination:</span>
                      <strong className="text-slate-900">{selectedMapPin.country}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Coordinates:</span>
                      <span className="text-slate-700">{selectedMapPin.lat.toFixed(4)}° N, {selectedMapPin.lng.toFixed(4)}° E</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tuition Benchmark:</span>
                      <strong className="text-royal">{selectedMapPin.tuition}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Post-Study Visa:</span>
                      <strong className="text-emerald-700">{selectedMapPin.stayback}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Select any geographic hub on the map to filter verified master's programs with statutory blocked account terms and prerequisite requirements.
                  </p>
                )}

                {/* Filtered Programs List Preview */}
                <div className="space-y-2 max-h-[260px] overflow-y-auto pt-2" data-lenis-prevent="true">
                  {(searchResults?.items || []).slice(0, 6).map((item: any) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedProgram(item)}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-royal transition-all cursor-pointer space-y-1"
                    >
                      <h5 className="text-xs font-bold text-slate-900 line-clamp-1">{item.title}</h5>
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>{item.universityName}</span>
                        <strong className="text-royal">{item.tuitionFeeLocal === 0 ? '€0' : `${item.currencyCode} ${item.tuitionFeeLocal.toLocaleString()}`}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className="w-full py-2.5 rounded-xl bg-royal hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
              >
                <span>View Full Faceted Grid ({searchResults?.total || 0} Programs)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE B: FACETED SEARCH GRID */}
      {/* ========================================================================= */}
      {viewMode === 'grid' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-500">
              Found {searchResults?.total || 0} Verified Program{searchResults?.total === 1 ? '' : 's'}
            </span>
          </div>

          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-royal border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-slate-500">Searching global program database...</p>
            </div>
          ) : searchResults?.items?.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No Programs Match Your Criteria</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Try widening your search query, increasing the maximum GPA bar, or clearing field filters.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-6 py-2.5 rounded-2xl bg-royal text-white text-xs font-bold shadow-md shadow-blue-500/20"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults?.items?.map((item: any) => {
                const shortlisted = isShortlisted(item.id);

                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -4 }}
                    className="glass-panel p-6 rounded-3xl border border-slate-200 hover:border-royal transition-all flex flex-col justify-between group shadow-sm hover:shadow-xl bg-white space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-start gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-royal border border-blue-200">
                          <MapPin className="w-3 h-3" />
                          <span>{item.countryName} ({item.countryIsoCode})</span>
                        </span>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                          {item.degreeLevel || 'MS'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold font-outfit text-slate-navy group-hover:text-royal transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-xs font-semibold text-slate-600">{item.universityName}</p>

                      <div className="space-y-1.5 text-xs font-mono bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Field:</span>
                          <span className="text-slate-800 font-semibold">{item.fieldOfStudy}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Tuition:</span>
                          <strong className="text-slate-900">
                            {item.tuitionFeeLocal ? `${item.currencyCode} ${item.tuitionFeeLocal.toLocaleString()}` : 'Tuition Free / €0'}
                          </strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Min Bar:</span>
                          <span className="text-royal font-bold">
                            {item.minGpa ? `GPA ${item.minGpa.toFixed(1)}/4.0` : 'Holistic'}
                            {item.minIelts ? ` • IELTS ${item.minIelts}` : ''}
                          </span>
                        </div>
                      </div>

                      {item.scholarshipRules && item.scholarshipRules.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                          <Award className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate font-semibold">
                            {item.scholarshipRules[0].title} ({item.scholarshipRules[0].coveragePct}% Coverage)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          toggleShortlist({
                            programId: item.id,
                            programTitle: item.title,
                            universityName: item.universityName,
                            countryName: item.countryName,
                            countryIsoCode: item.countryIsoCode,
                            domain: item.domain,
                            tuitionFeeLocal: item.tuitionFeeLocal,
                            currencyCode: item.currencyCode,
                            qualificationStatus: 'QUALIFIED',
                            matchFitScorePct: 90,
                            requirements: {
                              minGpa: item.minGpa || 3.0,
                              minIelts: item.minIelts || null,
                              minToefl: item.minToefl || null,
                              minGre: item.minGre || null,
                            },
                            officialSourceUrl: item.officialWebsiteUrl || item.sourceUrl,
                          });
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-colors ${
                          shortlisted
                            ? 'bg-blue-50 text-royal border-blue-200 font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-royal hover:text-royal'
                        }`}
                      >
                        {shortlisted ? (
                          <>
                            <Check className="w-3 h-3 text-royal" />
                            <span>Pinned</span>
                          </>
                        ) : (
                          <>
                            <Pin className="w-3 h-3" />
                            <span>Pin</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRoiProgram(item)}
                        className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Calculate Master's Career ROI"
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-royal" />
                        <span>ROI</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedProgram(item)}
                        className="py-1.5 px-3 rounded-xl bg-royal hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                      >
                        <span>Details</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROGRAM VIEW DETAILS MODAL (Isolated Smooth Scroll with min-h-0) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedProgram && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50 flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-royal border border-blue-200">
                      {selectedProgram.degreeLevel || 'MASTERS'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                      {selectedProgram.countryName || selectedProgram.countryIsoCode}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold font-outfit text-slate-navy">
                    {selectedProgram.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-600 flex items-center gap-1 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-royal" />
                    <span>{selectedProgram.universityName}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProgram(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Modal Body */}
              <div
                className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6"
                data-lenis-prevent="true"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                {/* Tuition & Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-1">
                    <span className="text-xs font-mono text-slate-500">Annual Tuition Fee</span>
                    <div className="text-lg font-bold font-outfit text-slate-navy">
                      {selectedProgram.tuitionFeeLocal
                        ? `${selectedProgram.currencyCode} ${selectedProgram.tuitionFeeLocal.toLocaleString()}`
                        : 'Tuition Free / €0'}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-xs font-mono text-slate-500">Duration & Language</span>
                    <div className="text-base font-bold font-outfit text-slate-navy">
                      {selectedProgram.durationMonths || 24} Months • {selectedProgram.language || 'English'}
                    </div>
                  </div>
                </div>

                {/* Admission & Language Requirements */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                    Verified Admission Thresholds
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Min Normalized GPA</span>
                      <strong className="text-slate-800">
                        {selectedProgram.requirements?.minGpa ? `${selectedProgram.requirements.minGpa.toFixed(1)} / 4.0` : 'Holistic'}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Min IELTS / TOEFL</span>
                      <strong className="text-slate-800">
                        {selectedProgram.requirements?.minIelts ? `IELTS ${selectedProgram.requirements.minIelts}` : 'Not Required'}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Work Experience</span>
                      <strong className="text-slate-800">
                        {selectedProgram.requirements?.workExpYearsRequired ? `${selectedProgram.requirements.workExpYearsRequired} Years` : 'Fresh Grads Welcome'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Category C: Application Document Checklist & Word Caps */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-royal" /> Application Document Intelligence
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">SOP Word Cap:</span>
                      <strong className="text-slate-900">{selectedProgram.sopMaxWords ? `${selectedProgram.sopMaxWords} Words` : '500 - 1000 Words'}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">LORs Required:</span>
                      <strong className="text-slate-900">{selectedProgram.lorAcademicCount || 2} Academic {selectedProgram.lorProfessionalCount ? `+ ${selectedProgram.lorProfessionalCount} Prof` : ''}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">CV / Resume Format:</span>
                      <strong className="text-slate-900">{selectedProgram.cvFormatRequired || 'Europass / Standard'}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Portfolio / GitHub:</span>
                      <strong className={selectedProgram.portfolioRequired ? 'text-amber-700' : 'text-slate-700'}>
                        {selectedProgram.portfolioRequired ? 'Required' : 'Optional / Not Required'}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">MOI English Waiver:</span>
                      <strong className="text-emerald-700">Accepted with Letter</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Evaluation Portal:</span>
                      <strong className="text-slate-900">Direct / uni-assist VPD</strong>
                    </div>
                  </div>
                </div>

                {/* Official Source Verification */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-royal">
                    <ShieldCheck className="w-4 h-4 text-royal" />
                    <span>Official Portal & Verification Source</span>
                  </div>
                  <p className="text-xs text-slate-600 font-mono">
                    Provider: {selectedProgram.officialSourceProvider || 'OFFICIAL_UNIVERSITY_PORTAL'}
                  </p>
                  {selectedProgram.officialWebsiteUrl || selectedProgram.officialSourceUrl || selectedProgram.sourceUrl ? (
                    <a
                      href={formatOfficialUrl(selectedProgram.officialWebsiteUrl || selectedProgram.officialSourceUrl || selectedProgram.sourceUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-royal hover:underline font-mono"
                    >
                      <span>Visit Official University Admissions Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : null}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedProgram(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-bold"
                >
                  Close
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRoiProgram(selectedProgram);
                      setSelectedProgram(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-royal" />
                    <span>Calculate ROI</span>
                  </button>
                  <a
                    href={`/match?country=${selectedProgram.countryIsoCode}`}
                    className="px-4 py-2 rounded-xl bg-royal hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Evaluate Profile Fit</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* CAREER ROI CALCULATOR MODAL */}
      {/* ========================================================================= */}
      {selectedRoiProgram && (
        <ROICalculatorModal
          isOpen={!!selectedRoiProgram}
          program={{
            programTitle: selectedRoiProgram.title || selectedRoiProgram.programTitle,
            universityName: selectedRoiProgram.universityName,
            countryName: selectedRoiProgram.countryName || 'Destination',
            currencyCode: selectedRoiProgram.currencyCode || 'EUR',
            tuitionFeeLocal: selectedRoiProgram.tuitionFeeLocal || 0,
            durationMonths: selectedRoiProgram.durationMonths || 24,
            scholarshipOffer: {
              publishedRules: (selectedRoiProgram.scholarshipRules || []).map((r: any) => ({
                calculatedPct: r.coveragePct || r.calculatedPct || 0,
              })),
            },
          }}
          onClose={() => setSelectedRoiProgram(null)}
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-mono text-xs text-slate-500">Loading Global Program Explorer...</div>}>
      <SearchContent />
    </Suspense>
  );
}
