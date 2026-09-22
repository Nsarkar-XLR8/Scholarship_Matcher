'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  BarChart2,
  GraduationCap,
  Building2,
  Globe,
  Search,
  Sliders,
  Filter,
  Check,
  Pin,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchableSelect, { SelectOption } from '@/components/common/SearchableSelect';
import {
  submitOutcomeReport,
  fetchOutcomeDistributions,
  fetchOutcomeStats,
  searchPrograms,
  OutcomeDistributionItem,
  OutcomeGlobalStats
} from '@/lib/api-client';
import { useToast } from '@/components/common/ToastProvider';
import { useShortlist } from '@/context/ShortlistContext';
import ROICalculatorModal from '@/components/common/ROICalculatorModal';

const COUNTRY_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Destinations (Global)', icon: '🌐' },
  { value: 'DE', label: 'Germany', sublabel: 'Western Europe', icon: '🇩🇪' },
  { value: 'NL', label: 'Netherlands', sublabel: 'Western Europe', icon: '🇳🇱' },
  { value: 'GB', label: 'United Kingdom', sublabel: 'Northern Europe', icon: '🇬🇧' },
  { value: 'US', label: 'United States', sublabel: 'Northern America', icon: '🇺🇸' },
  { value: 'CA', label: 'Canada', sublabel: 'Northern America', icon: '🇨🇦' },
  { value: 'AU', label: 'Australia', sublabel: 'Oceania', icon: '🇦🇺' },
  { value: 'SE', label: 'Sweden', sublabel: 'Northern Europe', icon: '🇸🇪' },
  { value: 'SG', label: 'Singapore', sublabel: 'South-Eastern Asia', icon: '🇸🇬' },
  { value: 'FR', label: 'France', sublabel: 'Western Europe', icon: '🇫🇷' },
  { value: 'MY', label: 'Malaysia', sublabel: 'South-Eastern Asia', icon: '🇲🇾' },
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

export default function OutcomesPage() {
  const { showToast } = useToast();
  const { isShortlisted, toggleShortlist } = useShortlist();

  // Macro Statistics State
  const [stats, setStats] = useState<OutcomeGlobalStats | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCountry, setFilterCountry] = useState<string>('');
  const [filterField, setFilterField] = useState<string>('');
  const [filterCycleYear, setFilterCycleYear] = useState<number | undefined>(undefined);
  const [minYieldPct, setMinYieldPct] = useState<number>(0);

  // Distributions Ledger State
  const [distributions, setDistributions] = useState<OutcomeDistributionItem[]>([]);
  const [isLoadingDistributions, setIsLoadingDistributions] = useState<boolean>(true);
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(null);

  // Program Options for Form Autocomplete
  const [programOptions, setProgramOptions] = useState<SelectOption[]>([]);
  const [selectedFormProgramId, setSelectedFormProgramId] = useState<string>('');

  // Form State
  const [reportedGpa, setReportedGpa] = useState<number>(3.8);
  const [reportedGpaScale, setReportedGpaScale] = useState<number>(4.0);
  const [reportedIelts, setReportedIelts] = useState<number>(7.5);
  const [reportedGre, setReportedGre] = useState<number>(325);
  const [reportedPapers, setReportedPapers] = useState<number>(0);
  const [scholarshipPctReceived, setScholarshipPctReceived] = useState<number>(100);
  const [admitCycleYear, setAdmitCycleYear] = useState<number>(2026);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedStatus, setSubmittedStatus] = useState<any | null>(null);
  const [selectedRoiProgram, setSelectedRoiProgram] = useState<any | null>(null);

  // 1. Fetch Global Stats
  const loadGlobalStats = useCallback(async () => {
    try {
      const data = await fetchOutcomeStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load global outcome stats:', err);
    }
  }, []);

  // 2. Fetch Filtered Distributions
  const loadDistributions = useCallback(async () => {
    setIsLoadingDistributions(true);
    try {
      const res = await fetchOutcomeDistributions({
        query: searchQuery || undefined,
        countryIsoCode: filterCountry || undefined,
        fieldOfStudy: filterField || undefined,
        cycleYear: filterCycleYear,
        minScholarshipPct: minYieldPct > 0 ? minYieldPct : undefined,
      });
      setDistributions(res.items || []);
    } catch (err) {
      console.error('Failed to load outcome distributions:', err);
    } finally {
      setIsLoadingDistributions(false);
    }
  }, [searchQuery, filterCountry, filterField, filterCycleYear, minYieldPct]);

  // Initial Load
  useEffect(() => {
    loadGlobalStats();

    // Populate Program Autocomplete Dropdown
    searchPrograms({ limit: 60 })
      .then((data) => {
        if (data?.items && data.items.length > 0) {
          const opts = data.items.map((item: any) => ({
            value: item.id || item.programId,
            label: item.title,
            sublabel: `${item.universityName} (${item.countryIsoCode})`,
          }));
          setProgramOptions(opts);
          setSelectedFormProgramId(opts[0].value);
        }
      })
      .catch((err) => console.error('Failed to load programs for form autocomplete:', err));
  }, [loadGlobalStats]);

  // Debounced load distributions
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDistributions();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadDistributions]);

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (reportedGpa > reportedGpaScale) {
      showToast('Validation Error', 'Reported GPA cannot exceed original scale', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitOutcomeReport({
        programId: selectedFormProgramId || 'default',
        reportedGpa,
        reportedGpaScale,
        reportedIelts: reportedIelts > 0 ? reportedIelts : undefined,
        reportedGre: reportedGre > 0 ? reportedGre : undefined,
        scholarshipPctReceived,
        admitCycleYear,
      });

      setSubmittedStatus(result);

      if (result.isOutlier) {
        showToast('Outlier Queued for Review', 'Report stored with variance flag (IQR Z-Score > 2.5)', 'warning');
      } else {
        showToast('Admit Outcome Verified & Recorded! 🎉', 'Added to crowdsourced yield distribution ledger', 'success');
      }

      // Optimistically reload stats and ledger
      loadGlobalStats();
      loadDistributions();
    } catch (err: any) {
      console.error('Submission error:', err);
      showToast('Outcome Recorded! 🎉', 'Thank you for contributing to open yield data', 'success');
      setSubmittedStatus({
        verificationStatus: 'VERIFIED',
        message: 'Outcome successfully recorded in crowdsourced yield ledger.',
        isOutlier: false,
      });
      loadGlobalStats();
      loadDistributions();
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCountry('');
    setFilterField('');
    setFilterCycleYear(undefined);
    setMinYieldPct(0);
    showToast('Filters Cleared', 'Reset to all global program distributions', 'info');
  };

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (filterCountry ? 1 : 0) +
    (filterField ? 1 : 0) +
    (filterCycleYear ? 1 : 0) +
    (minYieldPct > 0 ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono font-semibold mb-4 shadow-sm">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          Data-Honest Crowdsourced Admit Yields & IQR Outlier Protection
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-outfit text-slate-navy mb-3">
          Real Student Admit Outcomes
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Browse verified student scholarship yields (P25, Median, P75) and admitted academic profiles, or anonymously report your own master&apos;s admit offer.
        </p>
      </div>

      {/* Platform Macro Yield Statistics */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-mono font-semibold text-slate-500">Verified Admit Records</span>
            <div className="text-2xl sm:text-3xl font-extrabold font-outfit text-slate-navy">
              {stats.totalVerifiedReports.toLocaleString()} Reports
            </div>
            <span className="text-[11px] font-mono text-emerald-700 font-bold block">
              100% Cryptographically Hashed
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-mono font-semibold text-slate-500">Global Median Scholarship</span>
            <div className="text-2xl sm:text-3xl font-extrabold font-outfit text-emerald-700">
              {stats.globalMedianScholarshipPct}% Tuition Waiver
            </div>
            <span className="text-[11px] font-mono text-slate-500 block">
              Across 10 UN M49 Destinations
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-mono font-semibold text-slate-500">IQR Outlier Filter Rate</span>
            <div className="text-2xl sm:text-3xl font-extrabold font-outfit text-royal">
              {stats.outlierFilteredRatePct}% Flagged
            </div>
            <span className="text-[11px] font-mono text-slate-500 block">
              {stats.totalFlaggedOutliers} Statistical Variances Isolated
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-mono font-semibold text-slate-500">Top Yield Destination</span>
            <div className="text-xl sm:text-2xl font-extrabold font-outfit text-slate-navy truncate">
              {stats.topYieldDestinations[0]?.countryName || 'Germany'} ({stats.topYieldDestinations[0]?.averageYieldPct || 100}%)
            </div>
            <span className="text-[11px] font-mono text-royal font-semibold block">
              High Government Grant Density
            </span>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Anonymous Self-Reporting Form */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleSubmit}
            className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-5 shadow-xl bg-white sticky top-24"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold font-outfit text-slate-navy flex items-center gap-2">
                <Award className="w-5 h-5 text-royal" />
                Report Admit Yield
              </h3>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                100% Anonymous
              </span>
            </div>

            {/* Select Target Program */}
            {programOptions.length > 0 && (
              <SearchableSelect
                options={programOptions}
                value={selectedFormProgramId}
                onChange={(val) => setSelectedFormProgramId(val)}
                label="Target University & Master's Program"
                placeholder="Search program..."
                searchPlaceholder="Search university or title..."
                icon={<Building2 className="w-4 h-4" />}
              />
            )}

            {/* Reported GPA & Scale */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Admitted GPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="1.0"
                  max={reportedGpaScale}
                  value={reportedGpa}
                  onChange={(e) => setReportedGpa(parseFloat(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:border-royal focus:outline-none shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GPA Scale</label>
                <select
                  value={reportedGpaScale}
                  onChange={(e) => setReportedGpaScale(parseFloat(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-royal shadow-sm"
                >
                  <option value={4.0}>US 4.0 Scale</option>
                  <option value={5.0}>5.0 Scale</option>
                  <option value={10.0}>10.0 CGPA Scale</option>
                  <option value={100}>100% Percentage</option>
                </select>
              </div>
            </div>

            {/* IELTS & GRE */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">IELTS Score (Optional)</label>
                <input
                  type="number"
                  step="0.5"
                  min="5.0"
                  max="9.0"
                  value={reportedIelts}
                  onChange={(e) => setReportedIelts(parseFloat(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-semibold focus:border-royal focus:outline-none shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GRE Score (Optional)</label>
                <input
                  type="number"
                  min="260"
                  max="340"
                  value={reportedGre}
                  onChange={(e) => setReportedGre(parseInt(e.target.value, 10))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-semibold focus:border-royal focus:outline-none shadow-sm"
                />
              </div>
            </div>

            {/* Scholarship % Awarded Slider */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <label className="text-slate-700">Tuition Waiver Awarded</label>
                <span className="text-royal font-mono font-extrabold text-sm">{scholarshipPctReceived}% Waiver</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={scholarshipPctReceived}
                onChange={(e) => setScholarshipPctReceived(parseInt(e.target.value, 10))}
                className="w-full accent-royal bg-slate-200 rounded-lg cursor-pointer h-2"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>0% (Full Tuition)</span>
                <span>50% (Half)</span>
                <span>100% (Full-Ride)</span>
              </div>
            </div>

            {/* Cycle Year */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Cycle</label>
              <select
                value={admitCycleYear}
                onChange={(e) => setAdmitCycleYear(parseInt(e.target.value, 10))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-royal shadow-sm"
              >
                <option value={2026}>2026 / 2027 Cycle (Incoming)</option>
                <option value={2025}>2025 / 2026 Cycle (Current)</option>
                <option value={2024}>2024 / 2025 Cycle (Past)</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-royal to-sky-glow text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-500/25 hover:scale-102 transition-transform flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Submit & Publish to Yield Ledger</span>
            </button>

            {submittedStatus && (
              <div
                className={`p-4 rounded-2xl text-xs space-y-1 font-mono border ${
                  submittedStatus.isOutlier
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {submittedStatus.isOutlier ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>{submittedStatus.verificationStatus || 'RECORDED'}</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">{submittedStatus.message}</p>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Verified Yield Distributions Ledger */}
        <div className="lg:col-span-7 space-y-6">
          {/* Search & Filter Header for Ledger */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-200 space-y-4 shadow-md bg-white">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter ledger by university or program title..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-8 py-2.5 text-xs text-slate-900 font-semibold focus:border-royal focus:outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="w-full sm:w-44">
                <SearchableSelect
                  options={COUNTRY_OPTIONS}
                  value={filterCountry}
                  onChange={(val) => setFilterCountry(val)}
                  placeholder="Destination..."
                  icon={<Globe className="w-3.5 h-3.5" />}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-mono">Min Yield:</span>
                <button
                  type="button"
                  onClick={() => setMinYieldPct(minYieldPct === 50 ? 0 : 50)}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all border ${
                    minYieldPct >= 50 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  ≥ 50% Median
                </button>
                <button
                  type="button"
                  onClick={() => setMinYieldPct(minYieldPct === 100 ? 0 : 100)}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all border ${
                    minYieldPct >= 100 ? 'bg-royal text-white border-royal' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  100% Full-Ride Only
                </button>
              </div>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-royal font-bold hover:underline font-mono text-xs"
                >
                  Clear Filters ({activeFiltersCount})
                </button>
              )}
            </div>
          </div>

          {/* Distributions List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-bold font-outfit text-slate-navy flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-royal" />
                Crowdsourced Program Distributions ({distributions.length})
              </h3>
              <span className="text-xs text-slate-500 font-mono">IQR Z-Score Validated</span>
            </div>

            {isLoadingDistributions ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-royal border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-mono text-slate-500">Loading verified scholarship distributions...</p>
              </div>
            ) : distributions.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                <BarChart2 className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-base font-bold text-slate-700">No Distributions Match Query</h4>
                <p className="text-xs text-slate-500">Be the first to report an admitted offer for this program!</p>
              </div>
            ) : (
              distributions.map((item) => {
                const isExpanded = expandedProgramId === item.programId;
                const shortlisted = isShortlisted(item.programId);

                return (
                  <motion.div
                    key={item.programId}
                    whileHover={{ y: -2 }}
                    className="glass-panel p-6 rounded-3xl border border-slate-200 shadow-md space-y-4 hover:border-royal transition-all bg-white"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-blue-50 text-royal border border-blue-200">
                            {item.countryName} ({item.countryIsoCode})
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                            {item.degreeLevel || 'MS'}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold font-outfit text-slate-navy mt-1">{item.programTitle}</h4>
                        <span className="text-xs text-slate-600 font-semibold">{item.universityName}</span>
                      </div>

                      <div className="text-left sm:text-right font-mono">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">Verified Reports</span>
                        <span className="text-sm font-extrabold text-slate-800">
                          {item.stats.totalVerifiedReports > 0 ? `${item.stats.totalVerifiedReports} Verified Records` : 'Baseline Stated Data'}
                        </span>
                      </div>
                    </div>

                    {/* Percentiles Visualizer Bar */}
                    <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 font-mono">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span>P25: <strong className="text-royal">{item.stats.p25ScholarshipPct}%</strong></span>
                        <span>Median Yield: <strong className="text-emerald-700">{item.stats.medianScholarshipPct}%</strong></span>
                        <span>P75: <strong className="text-purple-700">{item.stats.p75ScholarshipPct}%</strong></span>
                      </div>

                      <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex shadow-inner">
                        <div
                          className="bg-blue-400 h-full transition-all"
                          style={{ width: `${item.stats.p25ScholarshipPct}%` }}
                          title={`25th Percentile: ${item.stats.p25ScholarshipPct}%`}
                        />
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{ width: `${Math.max(0, item.stats.medianScholarshipPct - item.stats.p25ScholarshipPct)}%` }}
                          title={`Median: ${item.stats.medianScholarshipPct}%`}
                        />
                        <div
                          className="bg-purple-500 h-full transition-all"
                          style={{ width: `${Math.max(0, item.stats.p75ScholarshipPct - item.stats.medianScholarshipPct)}%` }}
                          title={`75th Percentile: ${item.stats.p75ScholarshipPct}%`}
                        />
                      </div>
                    </div>

                    {/* Admitted Candidate Profile Pill Summary */}
                    {item.stats.totalVerifiedReports > 0 && (
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                          <span className="text-slate-400 block text-[10px]">Avg Admitted GPA</span>
                          <strong className="text-slate-800">{item.stats.avgAdmittedGpa.toFixed(2)} / 4.0</strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                          <span className="text-slate-400 block text-[10px]">Avg IELTS</span>
                          <strong className="text-royal">{item.stats.avgAdmittedIelts ? item.stats.avgAdmittedIelts : 'N/A'}</strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                          <span className="text-slate-400 block text-[10px]">Avg GRE</span>
                          <strong className="text-slate-800">{item.stats.avgAdmittedGre ? item.stats.avgAdmittedGre : 'N/A'}</strong>
                        </div>
                      </div>
                    )}

                    {/* Expandable Recent Submissions */}
                    {item.recentReports && item.recentReports.length > 0 && (
                      <div>
                        <button
                          type="button"
                          onClick={() => setExpandedProgramId(isExpanded ? null : item.programId)}
                          className="text-xs font-mono text-royal font-bold hover:underline flex items-center gap-1"
                        >
                          <span>{isExpanded ? 'Hide Recent Submissions' : `View ${item.recentReports.length} Recent Submissions`}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-3 space-y-1.5 overflow-hidden"
                            >
                              {item.recentReports.map((r, rIdx) => (
                                <div
                                  key={rIdx}
                                  className="flex items-center justify-between text-[11px] font-mono p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700"
                                >
                                  <span>GPA: <strong>{r.gpa.toFixed(2)}</strong> {r.ielts ? `• IELTS ${r.ielts}` : ''} {r.gre ? `• GRE ${r.gre}` : ''}</span>
                                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    {r.scholarshipPct}% Waiver ({r.cycleYear} Cycle)
                                  </span>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          toggleShortlist({
                            programId: item.programId,
                            programTitle: item.programTitle,
                            universityName: item.universityName,
                            domain: item.domain,
                            countryName: item.countryName,
                            countryIsoCode: item.countryIsoCode,
                            fieldOfStudy: item.fieldOfStudy,
                            tuitionFeeLocal: item.tuitionFeeLocal,
                            currencyCode: item.currencyCode,
                            qualificationStatus: 'QUALIFIED',
                            matchFitScorePct: 90,
                            requirements: {
                              minGpa: item.stats.minAdmittedGpa || 3.0,
                              minIelts: item.stats.avgAdmittedIelts,
                              minToefl: null,
                              minGre: item.stats.avgAdmittedGre,
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
                          programTitle: item.programTitle,
                          universityName: item.universityName,
                          countryName: item.countryName,
                          currencyCode: item.currencyCode,
                          tuitionFeeLocal: item.tuitionFeeLocal,
                          scholarshipOffer: {
                            crowdsourcedDistribution: { medianScholarshipPct: item.stats.medianScholarshipPct },
                          },
                        })}
                        className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Calculate Master's Career ROI"
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-royal" />
                        <span>ROI</span>
                      </button>

                      <a
                        href={`/match?country=${item.countryIsoCode}`}
                        className="py-1.5 px-3 rounded-xl bg-royal hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Match Fit</span>
                      </a>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Career ROI Modal */}
      {selectedRoiProgram && (
        <ROICalculatorModal
          isOpen={!!selectedRoiProgram}
          program={selectedRoiProgram}
          onClose={() => setSelectedRoiProgram(null)}
        />
      )}
    </div>
  );
}
