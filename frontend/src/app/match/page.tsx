'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles, GraduationCap, Globe, BookOpen, Award, ExternalLink, CheckCircle, AlertTriangle, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfidenceBadge from '@/components/common/ConfidenceBadge';
import { evaluateProfileMatch, MatchResult } from '@/lib/api-client';

function MatchContent() {
  const searchParams = useSearchParams();

  // Form State
  const [gpa, setGpa] = useState<number>(Number(searchParams.get('gpa')) || 3.5);
  const [gpaScale, setGpaScale] = useState<number>(4.0);
  const [ielts, setIelts] = useState<number | undefined>(7.0);
  const [gre, setGre] = useState<number | undefined>(320);
  const [papersCount, setPapersCount] = useState<number>(1);
  const [targetField, setTargetField] = useState<string>(searchParams.get('field') || 'Computer Science');
  const [preferredCountries, setPreferredCountries] = useState<string[]>(['DE', 'NL', 'GB', 'US', 'MY']);

  // Match Evaluation State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEvaluate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        preferredCountryIsoCodes: preferredCountries,
      });

      setMatchResult(data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to evaluate matches. Make sure NestJS backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleEvaluate();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-royal text-xs font-semibold mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          Multi-Scoped Eligibility & Scholarship Engine
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-outfit text-slate-navy mb-3">
          Evaluate Your Master’s Fit
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Our algorithm normalizes your GPA, checks published program requirements, and joins program, university, country, and global scholarship rules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Form Controls */}
        <div className="lg:col-span-4">
          <form onSubmit={handleEvaluate} className="glass-panel p-6 rounded-3xl border border-slate-200 space-y-6 sticky top-24 shadow-xl">
            <h3 className="text-lg font-bold font-outfit text-slate-navy flex items-center gap-2 border-b border-slate-100 pb-3">
              <GraduationCap className="w-5 h-5 text-royal" />
              Student Profile
            </h3>

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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Published Research Papers (DOI)</label>
              <input
                type="number"
                min="0"
                value={papersCount}
                onChange={(e) => setPapersCount(parseInt(e.target.value || '0', 10))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-semibold focus:border-royal focus:outline-none shadow-sm"
              />
            </div>

            {/* Target Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Field of Study</label>
              <input
                type="text"
                value={targetField}
                onChange={(e) => setTargetField(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-semibold focus:border-royal focus:outline-none shadow-sm"
                placeholder="Computer Science, Data..."
                required
              />
            </div>

            {/* Preferred Countries */}
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border border-blue-600 shadow-sm'
                          : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {country.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-royal to-sky-glow text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Algorithm...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Eligibility Match</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Dynamic Results Grid */}
        <div className="lg:col-span-8 space-y-6">
          {errorMsg && (
            <div className="glass-panel p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-sm flex items-center gap-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {matchResult && (
            <div className="flex items-center justify-between glass-panel p-4 rounded-2xl border border-blue-200 bg-blue-50/50">
              <div className="text-xs text-slate-700 font-medium">
                Normalized GPA (4.0 Scale): <span className="font-extrabold text-royal font-mono text-sm">{matchResult.normalizedGpa4Scale}</span>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Found <span className="text-slate-navy font-bold">{matchResult.matches.length}</span> Program Matches
              </div>
            </div>
          )}

          <AnimatePresence>
            {matchResult?.matches.map((match, idx) => (
              <motion.div
                key={match.programId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="glass-panel p-6 rounded-3xl border border-slate-200 hover:border-royal transition-all relative overflow-hidden shadow-lg"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">{match.countryName}</span>
                      <span className="text-xs text-slate-500 font-medium">• {match.campusName}</span>
                    </div>
                    <h3 className="text-xl font-bold font-outfit text-slate-navy">{match.programTitle}</h3>
                    <p className="text-sm text-royal font-semibold">{match.universityName}</p>
                  </div>

                  {/* Fit Score & Status Badge */}
                  <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase shadow-sm ${
                        match.qualificationStatus === 'QUALIFIED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : match.qualificationStatus === 'SAFETY'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {match.qualificationStatus}
                    </span>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block font-mono font-bold">Match Fit Score</span>
                      <span className="text-2xl font-black font-outfit text-royal gradient-text-royal">{match.matchFitScorePct}%</span>
                    </div>
                  </div>
                </div>

                {/* Requirements Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 mb-4 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] font-mono uppercase font-bold">Min GPA Required</span>
                    <span className="font-bold text-slate-800">{match.requirements.minGpa} / 4.0</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-mono uppercase font-bold">Min IELTS</span>
                    <span className="font-bold text-slate-800">{match.requirements.minIelts || 'Not Required'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-mono uppercase font-bold">Min GRE</span>
                    <span className="font-bold text-slate-800">{match.requirements.minGre || 'Optional'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-mono uppercase font-bold">Papers Required</span>
                    <span className="font-bold text-slate-800">{match.requirements.requiresPapers ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                {/* Scholarship Offers Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    Applicable Scholarship Scopes & Rules
                  </h4>

                  {match.scholarshipOffer.publishedRules.map((rule) => (
                    <div key={rule.ruleId} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            Scope: {rule.scope}
                          </span>
                          <span className="text-sm font-bold text-slate-navy">{rule.title}</span>
                        </div>
                        <ConfidenceBadge confidence={rule.confidence} />
                      </div>

                      <p className="text-xs text-slate-600">{rule.description || 'Verified funding rule for qualified applicants.'}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-600 font-medium">Calculated Scholarship Waiver:</span>
                        <span className="text-royal font-extrabold font-mono text-sm">{rule.calculatedPct}% Waiver</span>
                      </div>
                    </div>
                  ))}

                  {/* Crowdsourced Distribution if present */}
                  {match.scholarshipOffer.crowdsourcedDistribution && (
                    <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 text-xs space-y-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sky-900 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-royal" />
                          Student Self-Reported Admit Distribution
                        </span>
                        <ConfidenceBadge confidence="CROWDSOURCED" />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <span className="block text-[10px] text-slate-500 font-bold">25th Percentile</span>
                          <span className="font-bold text-slate-900">{match.scholarshipOffer.crowdsourcedDistribution.p25ScholarshipPct}%</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-blue-300 shadow-sm">
                          <span className="block text-[10px] text-royal font-bold">Median Yield</span>
                          <span className="font-extrabold text-royal">{match.scholarshipOffer.crowdsourcedDistribution.medianScholarshipPct}%</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <span className="block text-[10px] text-slate-500 font-bold">75th Percentile</span>
                          <span className="font-bold text-slate-900">{match.scholarshipOffer.crowdsourcedDistribution.p75ScholarshipPct}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function MatchPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-mono">Loading Match Engine...</div>}>
      <MatchContent />
    </Suspense>
  );
}
