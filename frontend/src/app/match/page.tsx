'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles, GraduationCap, Globe, BookOpen, Award, ExternalLink, CheckCircle, AlertTriangle, ArrowRight, ShieldCheck, RefreshCw, BarChart2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfidenceBadge from '@/components/common/ConfidenceBadge';
import SearchableSelect, { SelectOption } from '@/components/common/SearchableSelect';
import { evaluateProfileMatch, MatchResult } from '@/lib/api-client';
import { formatOfficialUrl } from '@/lib/url-formatter.util';

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

function MatchContent() {
  const searchParams = useSearchParams();

  // Form State
  const [gpa, setGpa] = useState<number>(Number(searchParams.get('gpa')) || 3.5);
  const [gpaScale, setGpaScale] = useState<number>(4.0);
  const [ielts, setIelts] = useState<number | undefined>(7.0);
  const [gre, setGre] = useState<number | undefined>(320);
  const [papersCount, setPapersCount] = useState<number>(1);
  const [targetField, setTargetField] = useState<string>(searchParams.get('field') || '');
  const [preferredCountries, setPreferredCountries] = useState<string[]>(['DE', 'NL', 'GB', 'US', 'MY']);

  // Match Filter Tab State
  const [activeTab, setActiveTab] = useState<'ALL' | 'QUALIFIED' | 'REACH' | 'SAFETY'>('ALL');

  // Match Evaluation State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
        targetField,
        preferredCountryIsoCodes: preferredCountries.length > 0 ? preferredCountries : ['DE', 'NL', 'GB', 'US', 'MY'],
      });

      setMatchResult(data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to evaluate matches. Make sure NestJS backend is running.');
    } finally {
      setIsLoading(false);
    }
  }, [gpa, gpaScale, ielts, gre, papersCount, targetField, preferredCountries]);

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
          Multi-Scoped Eligibility & Scholarship Engine
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-outfit text-slate-navy mb-3">
          Evaluate Your Master’s Fit
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Our algorithm normalizes your GPA to a 4.0 scale, evaluates language/research fit, and joins program, university, country, and global scholarship rules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Form Controls */}
        <div className="lg:col-span-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 space-y-6 sticky top-24 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold font-outfit text-slate-navy flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-royal" />
                Student Profile
              </h3>
              {isLoading && <RefreshCw className="w-4 h-4 text-royal animate-spin" />}
            </div>

            {/* GPA & Scale */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <label className="text-slate-700">GPA Score</label>
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
                  <option value={1.0}>German Scale (1.0 = Max)</option>
                </select>
              </div>
            </div>

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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Published Research Papers</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-2">Preferred Destinations</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { code: 'DE', label: 'Germany 🇩🇪' },
                  { code: 'NL', label: 'Netherlands 🇳🇱' },
                  { code: 'GB', label: 'UK 🇬🇧' },
                  { code: 'US', label: 'USA 🇺🇸' },
                  { code: 'MY', label: 'Malaysia 🇲🇾' },
                ].map((country) => {
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
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

            {/* Normalized GPA Meter */}
            {matchResult?.normalizedGpa4Scale !== undefined && (
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs space-y-1 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Normalized 4.0 GPA:</span>
                  <span className="text-royal font-extrabold text-sm">{matchResult.normalizedGpa4Scale.toFixed(2)}</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden mt-1">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-royal h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(matchResult.normalizedGpa4Scale / 4.0) * 100}%` }}
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
              {/* Category Filter Tabs */}
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

                <span className="text-xs text-slate-500 font-mono pr-2">
                  Total Matches: <strong className="text-slate-navy">{matchResult.matches.length}</strong>
                </span>
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

                          <div className="text-left sm:text-right font-mono">
                            <span className="block text-[10px] text-slate-400 uppercase font-bold">Match Score</span>
                            <span className="text-2xl font-extrabold gradient-text-royal">
                              {m.matchScore}%
                            </span>
                          </div>
                        </div>

                        {/* Fit Criteria Indicators */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 font-mono">
                          <div>
                            <span className="block text-slate-400 text-[10px]">Academic Fit</span>
                            <span className="font-bold text-slate-800">{m.gpaFit || '100%'}</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 text-[10px]">Language Fit</span>
                            <span className="font-bold text-slate-800">{m.languageFit || 'Pass'}</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 text-[10px]">Min GPA Req</span>
                            <span className="font-bold text-royal">{m.minGpaReq ? `${m.minGpaReq} / 4.0` : 'None'}</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 text-[10px]">Scholarship Scope</span>
                            <span className="font-bold text-amber-700">{m.scholarships?.length || 1} Rule(s) Joined</span>
                          </div>
                        </div>

                        {/* Joined Scholarship Rules */}
                        {m.scholarships && m.scholarships.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <h4 className="text-xs font-bold font-mono text-slate-500 uppercase flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-amber-600" /> Applicable Multi-Scoped Funding Rules
                            </h4>
                            <div className="space-y-2">
                              {m.scholarships.map((rule: any, rIdx: number) => (
                                <div
                                  key={rule.ruleId || rIdx}
                                  className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                >
                                  <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 text-[10px] font-mono font-bold uppercase">
                                        {rule.scope || 'UNIVERSITY'} SCOPE
                                      </span>
                                      <ConfidenceBadge confidence={rule.confidenceTier || 'VERIFIED'} />
                                    </div>
                                    <span className="font-bold text-amber-950 block">{rule.title}</span>
                                    <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                                      {rule.description || 'Provides partial or full tuition waiver based on merit.'}
                                    </p>
                                  </div>
                                  <div className="shrink-0 font-mono text-right flex flex-col sm:items-end gap-1">
                                    <span className="block text-xs font-extrabold text-amber-900">
                                      {rule.coveragePercentage ? `${rule.coveragePercentage}% Waiver` : 'Full Aid'}
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
                    <p className="text-xs text-slate-500 mt-1">Try switching to the "ALL" tab or lowering your required threshold.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
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
