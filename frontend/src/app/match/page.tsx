'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  GraduationCap,
  Globe,
  BookOpen,
  Award,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  BarChart2,
  CheckCircle2,
  Briefcase,
  Calendar,
  Printer,
  FileText,
  Clock,
  TrendingUp,
  Bookmark,
  BookmarkCheck,
  Calculator,
  Download,
  Sliders,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfidenceBadge from '@/components/common/ConfidenceBadge';
import SearchableSelect, { SelectOption } from '@/components/common/SearchableSelect';
import { evaluateProfileMatch, MatchResult } from '@/lib/api-client';
import { formatOfficialUrl } from '@/lib/url-formatter.util';
import { useShortlist, ShortlistedProgram } from '@/context/ShortlistContext';
import ROICalculatorModal from '@/components/common/ROICalculatorModal';
import { generateIcsMilestoneCalendar, downloadIcsFile, createGoogleCalendarUrl } from '@/lib/calendar-generator.util';

const FIELD_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Fields of Study', icon: '🎓' },
  { value: 'Computer Science', label: 'Computer Science', sublabel: 'STEM / Technology' },
  { value: 'Data Science & AI', label: 'Data Science & Artificial Intelligence', sublabel: 'STEM / Analytics' },
  { value: 'Electrical Engineering', label: 'Electrical Engineering', sublabel: 'Engineering' },
  { value: 'Biomedical Engineering', label: 'Biomedical Engineering', sublabel: 'Engineering / Life Sciences' },
  { value: 'Business Analytics', label: 'Business Analytics & Finance', sublabel: 'Business / Finance' },
  { value: 'Public Policy', label: 'Public Policy & Governance', sublabel: 'Social Sciences' },
  { value: 'Environmental Science', label: 'Environmental & Energy Science', sublabel: 'Sustainability' },
];

const ALL_COUNTRY_OPTIONS = [
  { code: 'DE', label: 'Germany 🇩🇪' },
  { code: 'NL', label: 'Netherlands 🇳🇱' },
  { code: 'GB', label: 'UK 🇬🇧' },
  { code: 'US', label: 'USA 🇺🇸' },
  { code: 'CA', label: 'Canada 🇨🇦' },
  { code: 'AU', label: 'Australia 🇦🇺' },
  { code: 'SE', label: 'Sweden 🇸🇪' },
  { code: 'SG', label: 'Singapore 🇸🇬' },
  { code: 'FR', label: 'France 🇫🇷' },
  { code: 'MY', label: 'Malaysia 🇲🇾' },
];

function MatchContent() {
  const searchParams = useSearchParams();
  const { isShortlisted, toggleShortlist } = useShortlist();

  // User Persona State: Student vs Working Professional
  const [persona, setPersona] = useState<'STUDENT' | 'PROFESSIONAL'>('STUDENT');

  // Form State
  const [gpa, setGpa] = useState<number>(Number(searchParams.get('gpa')) || 3.4);
  const [gpaScale, setGpaScale] = useState<number>(4.0);
  const [ielts, setIelts] = useState<number | undefined>(7.0);
  const [gre, setGre] = useState<number | undefined>(320);
  const [papersCount, setPapersCount] = useState<number>(0);
  const [workExpYears, setWorkExpYears] = useState<number>(0);
  const [workExpRelevance, setWorkExpRelevance] = useState<'DIRECT' | 'ADJACENT' | 'GENERAL'>('DIRECT');
  const [targetField, setTargetField] = useState<string>(searchParams.get('field') || '');
  const urlCountry = searchParams.get('country');
  const [preferredCountries, setPreferredCountries] = useState<string[]>(
    urlCountry ? [urlCountry.toUpperCase()] : ['DE', 'NL', 'GB', 'US', 'CA', 'AU', 'SE', 'SG', 'FR', 'MY']
  );

  // Match Filter Tab State
  const [activeTab, setActiveTab] = useState<'ALL' | 'QUALIFIED' | 'REACH' | 'SAFETY'>('ALL');

  // Match Evaluation State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ROI Calculator Modal State
  const [selectedRoiProgram, setSelectedRoiProgram] = useState<any | null>(null);

  const handleEvaluate = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await evaluateProfileMatch({
        gpa,
        gpaScale,
        ielts,
        gre,
        papersCount,
        workExpYears: persona === 'PROFESSIONAL' ? workExpYears : 0,
        workExpRelevance,
        targetField,
        preferredCountryIsoCodes: preferredCountries.length > 0 ? preferredCountries : ['DE', 'NL', 'GB', 'US', 'CA', 'AU', 'SE', 'SG', 'FR', 'MY'],
      });

      setMatchResult(data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to evaluate matches. Make sure NestJS backend is running.');
    } finally {
      setIsLoading(false);
    }
  }, [gpa, gpaScale, ielts, gre, papersCount, persona, workExpYears, workExpRelevance, targetField, preferredCountries]);

  // Debounced auto-evaluation on form change
  useEffect(() => {
    const timer = setTimeout(() => {
      handleEvaluate();
    }, 400);
    return () => clearTimeout(timer);
  }, [handleEvaluate]);

  // Filtered Programs based on active tab
  const filteredMatches = matchResult?.matches?.filter((m: any) => {
    if (activeTab === 'ALL') return true;
    return m.qualificationStatus === activeTab;
  }) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-royal text-xs font-semibold mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          Data-Honest Eligibility & Funding Architecture
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-outfit text-slate-navy mb-3">
          Evaluate Your Master’s Fit
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          100% accurate conversion across Bavarian, Indian 10.0 CGPA, UK Honours & US scales with holistic work experience compensation for job holders.
        </p>

        {/* Persona Switcher Tabs */}
        <div className="inline-flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200 mt-6 shadow-sm">
          <button
            type="button"
            onClick={() => {
              setPersona('STUDENT');
              setWorkExpYears(0);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              persona === 'STUDENT'
                ? 'bg-gradient-to-r from-blue-600 to-royal text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Undergrad / Fresh Graduate</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPersona('PROFESSIONAL');
              if (workExpYears === 0) setWorkExpYears(3);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              persona === 'PROFESSIONAL'
                ? 'bg-gradient-to-r from-blue-600 to-royal text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Working Professional / Job Holder</span>
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Profile Inputs */}
        <div className="lg:col-span-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 space-y-6 sticky top-24 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold font-outfit text-slate-navy flex items-center gap-2">
                {persona === 'PROFESSIONAL' ? <Briefcase className="w-5 h-5 text-royal" /> : <GraduationCap className="w-5 h-5 text-royal" />}
                {persona === 'PROFESSIONAL' ? 'Professional Profile' : 'Student Profile'}
              </h3>
              {isLoading && <RefreshCw className="w-4 h-4 text-royal animate-spin" />}
            </div>

            {/* GPA & Scale */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <label className="text-slate-700">Undergraduate GPA</label>
                <span className="text-royal font-mono font-extrabold text-sm">{gpa} / {gpaScale}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max={gpaScale}
                step="0.05"
                value={gpa}
                onChange={(e) => setGpa(parseFloat(e.target.value))}
                className="w-full accent-royal bg-slate-200 rounded-lg cursor-pointer h-2"
              />
              <div className="flex justify-between items-center pt-1 text-[11px] text-slate-500 font-medium">
                <span>Original Scale:</span>
                <select
                  value={gpaScale}
                  onChange={(e) => {
                    const newScale = parseFloat(e.target.value);
                    setGpaScale(newScale);
                    if (gpa > newScale) setGpa(newScale);
                  }}
                  className="bg-white border border-slate-200 text-slate-800 font-semibold rounded px-2 py-0.5 focus:outline-none focus:border-royal"
                >
                  <option value={4.0}>4.0 Scale (US / Standard)</option>
                  <option value={5.0}>5.0 Scale</option>
                  <option value={10.0}>10.0 Scale (India CGPA)</option>
                  <option value={100}>100% Percentage</option>
                  <option value={1.0}>German Bavarian (1.0 = Best)</option>
                </select>
              </div>
            </div>

            {/* Working Professional Controls */}
            {persona === 'PROFESSIONAL' && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-amber-700" />
                    Industry Experience
                  </label>
                  <span className="text-xs font-mono font-extrabold text-amber-950">{workExpYears} Year(s)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="1"
                  value={workExpYears}
                  onChange={(e) => setWorkExpYears(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-600 bg-amber-200 rounded-lg cursor-pointer h-2"
                />

                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-bold text-amber-900 block">Experience Domain Relevance</label>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                    {(['DIRECT', 'ADJACENT', 'GENERAL'] as const).map((rel) => (
                      <button
                        key={rel}
                        type="button"
                        onClick={() => setWorkExpRelevance(rel)}
                        className={`py-1 px-1.5 rounded-lg font-bold border transition-all text-center ${
                          workExpRelevance === rel
                            ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                            : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {rel}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Test Scores */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">IELTS Score</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="9"
                  value={ielts || ''}
                  onChange={(e) => setIelts(e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-semibold focus:border-royal focus:outline-none shadow-sm"
                  placeholder="e.g. 7.0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GRE General</label>
                <input
                  type="number"
                  min="260"
                  max="340"
                  value={gre || ''}
                  onChange={(e) => setGre(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-semibold focus:border-royal focus:outline-none shadow-sm"
                  placeholder="e.g. 320"
                />
              </div>
            </div>

            {/* Research Papers */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Published Research Papers (DOI)</label>
              <input
                type="number"
                min="0"
                value={papersCount}
                onChange={(e) => setPapersCount(parseInt(e.target.value || '0', 10))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-semibold focus:border-royal focus:outline-none shadow-sm"
              />
            </div>

            {/* Searchable Target Field */}
            <SearchableSelect
              options={FIELD_OPTIONS}
              value={targetField}
              onChange={(val) => setTargetField(val)}
              label="Target Field of Study"
              placeholder="Select field of study..."
              searchPlaceholder="Search study field..."
              icon={<GraduationCap className="w-4 h-4" />}
            />

            {/* Preferred Countries Toggle */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-700">Target Study Destinations</label>
                <button
                  type="button"
                  onClick={() => {
                    if (preferredCountries.length === ALL_COUNTRY_OPTIONS.length) {
                      setPreferredCountries(['DE', 'NL', 'GB', 'US']);
                    } else {
                      setPreferredCountries(ALL_COUNTRY_OPTIONS.map((c) => c.code));
                    }
                  }}
                  className="text-[10px] text-royal font-bold hover:underline"
                >
                  {preferredCountries.length === ALL_COUNTRY_OPTIONS.length ? 'Reset Default' : 'Select All (10)'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_COUNTRY_OPTIONS.map((country) => {
                  const isSelected = preferredCountries.includes(country.code);
                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setPreferredCountries(preferredCountries.filter((c) => c !== country.code));
                        } else {
                          setPreferredCountries([...preferredCountries, country.code]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-600 to-royal text-white shadow-sm'
                          : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {country.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Normalized & Effective GPA Meter */}
            {matchResult && (
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs space-y-2 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Standard 4.0 GPA:</span>
                  <span className="text-slate-800 font-bold">{matchResult.normalizedGpa4Scale.toFixed(2)}</span>
                </div>

                {matchResult.workExperienceCompensation && matchResult.workExperienceCompensation.gpaBoost > 0 && (
                  <div className="p-2 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-900 text-[11px] space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span>Experience Compensation:</span>
                      <span>+{matchResult.workExperienceCompensation.gpaBoost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-amber-800">
                      <span>Effective Evaluated GPA:</span>
                      <strong className="text-amber-950 font-extrabold text-xs">
                        {matchResult.effectiveGpa4Scale?.toFixed(2)} / 4.0
                      </strong>
                    </div>
                  </div>
                )}

                <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden mt-1">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-royal h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${((matchResult.effectiveGpa4Scale || matchResult.normalizedGpa4Scale) / 4.0) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Match Evaluation Results */}
        <div className="lg:col-span-8">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium mb-6 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Results Summary & Filter Tabs */}
          {matchResult && (
            <div className="space-y-6">
              {/* Category Filter Tabs & Print Button */}
              <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-2.5 rounded-2xl border border-slate-200 shadow-md">
                <div className="flex items-center gap-1.5">
                  {(['ALL', 'QUALIFIED', 'REACH', 'SAFETY'] as const).map((tab) => {
                    const count =
                      tab === 'ALL'
                        ? matchResult.matches.length
                        : matchResult.matches.filter((m: any) => m.qualificationStatus === tab).length;
                    const isActive = activeTab === tab;

                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-royal text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>{tab}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-mono">
                    Matches: <strong className="text-slate-navy">{matchResult.matches.length}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all shadow-sm"
                    title="Print or Save Shortlist as PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Dossier</span>
                  </button>
                </div>
              </div>

              {/* Matched Program Cards */}
              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                  {filteredMatches.map((m: any, idx: number) => {
                    const statusColors = {
                      QUALIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      REACH: 'bg-amber-50 text-amber-700 border-amber-200',
                      SAFETY: 'bg-blue-50 text-royal border-blue-200',
                    };

                    const shortlisted = isShortlisted(m.programId);
                    const effectiveGpaUsed = matchResult.effectiveGpa4Scale || matchResult.normalizedGpa4Scale;
                    const gpaDeficit = m.requirements?.minGpa ? (m.requirements.minGpa - effectiveGpaUsed) : 0;
                    const ieltsDeficit = (m.requirements?.minIelts && ielts) ? (m.requirements.minIelts - ielts) : 0;

                    return (
                      <motion.div
                        key={m.programId || idx}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        className="glass-panel p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4 hover:border-royal transition-all"
                      >
                        {/* Program Card Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                                {m.countryName || m.countryIsoCode}
                              </span>
                              <span
                                className={`text-xs font-mono font-extrabold px-3 py-0.5 rounded-full border ${
                                  statusColors[m.qualificationStatus as keyof typeof statusColors] ||
                                  'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {m.qualificationStatus}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold font-outfit text-slate-navy">{m.programTitle}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs font-semibold text-royal">{m.universityName}</p>
                              <a
                                href={formatOfficialUrl(m.officialWebsiteUrl, m.domain, m.universityName)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-royal hover:underline font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200"
                                title={`Visit official portal for ${m.universityName}`}
                              >
                                <span>Official Portal</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>

                          {/* Fit Score & Action Buttons */}
                          <div className="flex items-center sm:flex-col sm:items-end justify-between gap-3">
                            <div className="text-left sm:text-right font-mono">
                              <span className="block text-[10px] text-slate-400 uppercase font-bold">Match Fit Score</span>
                              <span className="text-2xl font-extrabold gradient-text-royal">
                                {m.matchFitScorePct}%
                              </span>
                            </div>

                            {/* Shortlist & ROI Action Buttons */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleShortlist({
                                    programId: m.programId,
                                    programTitle: m.programTitle,
                                    universityName: m.universityName,
                                    countryName: m.countryName,
                                    countryIsoCode: m.countryIsoCode,
                                    domain: m.domain,
                                    tuitionFeeLocal: m.tuitionFeeLocal,
                                    currencyCode: m.currencyCode,
                                    qualificationStatus: m.qualificationStatus,
                                    matchFitScorePct: m.matchFitScorePct,
                                    requirements: m.requirements,
                                    scholarshipOffer: m.scholarshipOffer,
                                    officialSourceUrl: m.officialSourceUrl || m.sourceUrl,
                                    applicationDeadline: m.applicationDeadline,
                                    milestones: m.milestones,
                                  })
                                }
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                  shortlisted
                                    ? 'bg-royal text-white shadow-md'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                }`}
                                title="Pin to compare with other programs"
                              >
                                {shortlisted ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                                <span>{shortlisted ? 'Pinned' : 'Pin to Compare'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedRoiProgram(m)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all shadow-sm"
                                title="Calculate ROI & Break-even timeline"
                              >
                                <Calculator className="w-3.5 h-3.5 text-amber-700" />
                                <span>Career ROI</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Fit Criteria Indicators */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 font-mono">
                          <div>
                            <span className="block text-slate-400 text-[10px]">Min GPA Req</span>
                            <span className="font-bold text-royal">{m.requirements?.minGpa ? `${m.requirements.minGpa} / 4.0` : 'None'}</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 text-[10px]">Language Score</span>
                            <span className="font-bold text-slate-800">{m.requirements?.minIelts ? `IELTS ${m.requirements.minIelts}+` : 'English Waiver'}</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 text-[10px]">Annual Tuition</span>
                            <span className="font-bold text-emerald-700">
                              {m.tuitionFeeLocal === 0 ? 'Zero-Tuition 🆓' : `${m.tuitionFeeLocal?.toLocaleString()} ${m.currencyCode}`}
                            </span>
                          </div>
                          <div>
                            <span className="block text-slate-400 text-[10px]">Funding Rules</span>
                            <span className="font-bold text-amber-700">{m.scholarshipOffer?.publishedRules?.length || 0} Scope(s)</span>
                          </div>
                        </div>

                        {/* Gap Analysis & Prerequisite Diagnostics (if REACH) */}
                        {m.qualificationStatus === 'REACH' && (gpaDeficit > 0 || ieltsDeficit > 0) && (
                          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs space-y-1.5">
                            <div className="flex items-center gap-1.5 font-bold text-amber-950 font-mono">
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                              <span>Prerequisite Gap Diagnostics & Remediation</span>
                            </div>
                            <div className="space-y-1 text-[11px] text-amber-900 leading-relaxed">
                              {gpaDeficit > 0 && (
                                <p>
                                  • <strong>GPA Gap:</strong> Current effective score is {effectiveGpaUsed.toFixed(2)}, which is {gpaDeficit.toFixed(2)} points below the {m.requirements.minGpa.toFixed(2)} cutoff. {persona === 'STUDENT' ? 'Adding 2+ years of relevant industry experience or 1 published research paper will boost your holistic score into the qualified zone.' : 'Consider selecting DIRECT relevance if your work aligns with this field.'}
                                </p>
                              )}
                              {ieltsDeficit > 0 && (
                                <p>
                                  • <strong>Language Gap:</strong> Required score is IELTS {m.requirements.minIelts} (Current: {ielts}). Retaking IELTS or scoring 95+ on TOEFL iBT will satisfy this criterion.
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Application Milestone Roadmap & Calendar Export */}
                        {m.milestones && (
                          <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-2.5">
                            <div className="flex flex-wrap justify-between items-center gap-2">
                              <h4 className="text-[11px] font-bold font-mono text-royal uppercase flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-royal" /> Application Milestone Schedule
                              </h4>

                              {/* Calendar Sync Actions */}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const ics = generateIcsMilestoneCalendar(m.programTitle, m.universityName, m.milestones);
                                    downloadIcsFile(`${m.universityName.replace(/[^a-zA-Z0-9]/g, '_')}_milestones.ics`, ics);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-royal hover:bg-blue-50 text-[10px] font-mono font-bold transition-all shadow-sm"
                                  title="Download Apple / Outlook / Google .ics Calendar File"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Download .ics</span>
                                </button>

                                <a
                                  href={createGoogleCalendarUrl(
                                    `Submit Application: ${m.programTitle} (${m.universityName})`,
                                    `ScholarMatch application milestone window: ${m.milestones.portalSubmissionWindow}. Ensure certified transcripts and test scores are submitted.`,
                                    m.universityName,
                                    m.milestones.portalSubmissionWindow
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-royal text-white hover:bg-blue-700 text-[10px] font-mono font-bold transition-all shadow-sm"
                                  title="Add to Google Calendar"
                                >
                                  <Calendar className="w-3 h-3" />
                                  <span>Add to GCal</span>
                                </a>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-700">
                              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                <span className="block text-[10px] text-slate-400">1. Language Test Deadline</span>
                                <strong className="text-slate-900">{m.milestones.languageTestBy}</strong>
                              </div>
                              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                <span className="block text-[10px] text-slate-400">2. Portal Submission</span>
                                <strong className="text-slate-900">{m.milestones.portalSubmissionWindow}</strong>
                              </div>
                              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                <span className="block text-[10px] text-slate-400">3. Visa Appointment</span>
                                <strong className="text-slate-900">{m.milestones.visaAppointmentBy}</strong>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Joined Scholarship Rules */}
                        {m.scholarshipOffer?.publishedRules && m.scholarshipOffer.publishedRules.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <h4 className="text-xs font-bold font-mono text-slate-500 uppercase flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-amber-600" /> Applicable Multi-Scoped Funding Rules
                            </h4>
                            <div className="space-y-2">
                              {m.scholarshipOffer.publishedRules.map((rule: any, rIdx: number) => (
                                <div
                                  key={rule.ruleId || rIdx}
                                  className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                >
                                  <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 text-[10px] font-mono font-bold uppercase">
                                        {rule.scope || 'UNIVERSITY'} SCOPE
                                      </span>
                                      <ConfidenceBadge confidence={rule.confidence || 'VERIFIED'} />
                                    </div>
                                    <span className="font-bold text-amber-950 block">{rule.title}</span>
                                    <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                                      {rule.description || 'Provides partial or full tuition waiver based on merit.'}
                                    </p>
                                  </div>
                                  <div className="shrink-0 font-mono text-right flex flex-col sm:items-end gap-1">
                                    <span className="block text-xs font-extrabold text-amber-900">
                                      {rule.calculatedPct ? `${rule.calculatedPct}% Waiver` : 'Full Aid'}
                                    </span>
                                    <a
                                      href={formatOfficialUrl(rule.sourceUrl, m.domain, `${rule.title} official rule`)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 hover:text-amber-950 hover:underline bg-amber-200/60 px-2 py-0.5 rounded"
                                    >
                                      <span>Official Rule Source</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredMatches.length === 0 && (
                  <div className="py-12 text-center glass-panel rounded-3xl border border-slate-200 p-8">
                    <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-700">No matches found for "{activeTab}" filter</h4>
                    <p className="text-xs text-slate-500 mt-1">Try switching to the "ALL" tab or adjusting your preferences.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ROI Calculator Modal */}
      {selectedRoiProgram && (
        <ROICalculatorModal
          isOpen={!!selectedRoiProgram}
          onClose={() => setSelectedRoiProgram(null)}
          program={selectedRoiProgram}
        />
      )}
    </div>
  );
}

export default function MatchPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-mono text-xs text-slate-500">Loading Eligibility Engine...</div>}>
      <MatchContent />
    </Suspense>
  );
}
