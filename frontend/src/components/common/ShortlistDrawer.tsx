'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookmarkCheck, X, Columns3, Trash2, ExternalLink, ArrowRight, Award, ShieldCheck, CheckCircle2, AlertTriangle, Building2, Globe, Printer, Share2, Check, FileText } from 'lucide-react';
import { useShortlist } from '@/context/ShortlistContext';
import ConfidenceBadge from './ConfidenceBadge';
import { formatOfficialUrl } from '@/lib/url-formatter.util';

export default function ShortlistDrawer() {
  const {
    shortlist,
    removeFromShortlist,
    clearShortlist,
    isComparisonOpen,
    setIsComparisonOpen,
  } = useShortlist();

  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  if (shortlist.length === 0) return null;

  const handleCopyShareLink = () => {
    const ids = shortlist.map((p) => p.programId).join(',');
    const url = `${window.location.origin}/comparison?compare=${encodeURIComponent(ids)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <>
      {/* Floating Bottom Bar */}
      <AnimatePresence>
        {!isComparisonOpen && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 inset-x-0 z-40 max-w-2xl mx-auto px-4 pointer-events-none print:hidden"
          >
            <div className="pointer-events-auto bg-slate-900/90 text-white backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3 sm:p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-royal flex items-center justify-center text-white font-bold shadow-md">
                  <BookmarkCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold font-outfit text-white">
                    {shortlist.length} {shortlist.length === 1 ? 'Program' : 'Programs'} Shortlisted
                  </h4>
                  <p className="text-[11px] text-slate-300 hidden sm:block">
                    Compare tuition, GPA cutoffs & scholarships side-by-side
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearShortlist}
                  className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs hover:bg-white/10 transition-colors"
                  title="Clear Shortlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsComparisonOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-royal hover:from-blue-700 hover:to-royal text-white text-xs font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-1.5"
                >
                  <Columns3 className="w-4 h-4" />
                  <span>Compare Matrix</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Side-by-Side Comparison Modal */}
      <AnimatePresence>
        {isComparisonOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static"
            data-lenis-prevent="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              data-lenis-prevent="true"
              className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col print:max-h-none print:shadow-none print:border-none print:rounded-none"
            >
              {/* Header */}
              <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 shrink-0 print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-300 print:p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 print:hidden">
                    <Columns3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold font-outfit text-white print:text-slate-900">
                      Side-by-Side Master's Comparison Matrix
                    </h2>
                    <p className="text-slate-400 print:text-slate-600 text-xs mt-0.5">
                      Comparing {shortlist.length} selected candidate programs across verified criteria & proof-of-funds rules
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      copiedLink
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                    title="Copy stateless shareable URL"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Share Matrix'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintPdf}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                    title="Export Comparison PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={clearShortlist}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-medium transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setIsComparisonOpen(false)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Matrix Table */}
              <div 
                className="p-6 overflow-x-auto overflow-y-auto flex-1 overscroll-contain print:p-2"
                data-lenis-prevent="true"
              >
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="p-4 bg-slate-50 font-mono text-xs font-bold text-slate-500 uppercase tracking-wider w-1/5">
                        Criterion
                      </th>
                      {shortlist.map((prog) => (
                        <th key={prog.programId} className="p-4 bg-blue-50/40 border-l border-slate-200 w-1/4 align-top">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="text-[10px] font-mono font-bold text-royal uppercase tracking-wider block">
                                {prog.countryName} ({prog.countryIsoCode})
                              </span>
                              <h3 className="text-sm font-bold text-slate-900 font-outfit leading-snug mt-1">
                                {prog.programTitle}
                              </h3>
                              <span className="text-xs text-slate-600 block mt-0.5">
                                {prog.universityName}
                              </span>
                            </div>
                            <button
                              onClick={() => removeFromShortlist(prog.programId)}
                              className="text-slate-400 hover:text-red-500 p-1 transition-colors print:hidden"
                              title="Remove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {/* Qualification Status */}
                    <tr>
                      <td className="p-4 font-semibold text-slate-700 bg-slate-50">Match Category</td>
                      {shortlist.map((prog) => (
                        <td key={prog.programId} className="p-4 border-l border-slate-200">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                              prog.qualificationStatus === 'QUALIFIED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : prog.qualificationStatus === 'REACH'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {prog.qualificationStatus === 'QUALIFIED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {prog.qualificationStatus === 'REACH' && <AlertTriangle className="w-3.5 h-3.5" />}
                            {prog.qualificationStatus} ({prog.matchFitScorePct}% Fit)
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Minimum GPA */}
                    <tr>
                      <td className="p-4 font-semibold text-slate-700 bg-slate-50">Min. Normalized GPA</td>
                      {shortlist.map((prog) => (
                        <td key={prog.programId} className="p-4 border-l border-slate-200 font-mono font-bold text-slate-900">
                          {prog.requirements.minGpa.toFixed(2)} / 4.0 Scale
                        </td>
                      ))}
                    </tr>

                    {/* Language Requirements */}
                    <tr>
                      <td className="p-4 font-semibold text-slate-700 bg-slate-50">Min. English Scores</td>
                      {shortlist.map((prog) => (
                        <td key={prog.programId} className="p-4 border-l border-slate-200 text-slate-700">
                          <div className="space-y-1 font-mono">
                            {prog.requirements.minIelts && (
                              <div>IELTS: <strong className="text-slate-900">{prog.requirements.minIelts}</strong></div>
                            )}
                            {prog.requirements.minToefl && (
                              <div>TOEFL iBT: <strong className="text-slate-900">{prog.requirements.minToefl}</strong></div>
                            )}
                            {!prog.requirements.minIelts && !prog.requirements.minToefl && (
                              <span className="text-slate-400 italic">Institution Standard</span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Tuition Fee */}
                    <tr>
                      <td className="p-4 font-semibold text-slate-700 bg-slate-50">Annual Tuition</td>
                      {shortlist.map((prog) => (
                        <td key={prog.programId} className="p-4 border-l border-slate-200 font-mono font-bold text-royal text-sm">
                          {prog.tuitionFeeLocal === 0
                            ? 'Tuition Free (Public)'
                            : `${prog.tuitionFeeLocal.toLocaleString()} ${prog.currencyCode}`}
                        </td>
                      ))}
                    </tr>

                    {/* Scholarship Coverage */}
                    <tr>
                      <td className="p-4 font-semibold text-slate-700 bg-slate-50">Scholarship Opportunities</td>
                      {shortlist.map((prog) => {
                        const topRule = prog.scholarshipOffer?.publishedRules?.[0];
                        const medianYield = prog.scholarshipOffer?.crowdsourcedDistribution?.medianScholarshipPct;
                        return (
                          <td key={prog.programId} className="p-4 border-l border-slate-200">
                            {topRule ? (
                              <div className="space-y-1.5">
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                                  <Award className="w-3.5 h-3.5" />
                                  {topRule.calculatedPct}% Coverage
                                </span>
                                <p className="text-[11px] text-slate-600 line-clamp-2">{topRule.title}</p>
                              </div>
                            ) : medianYield !== undefined ? (
                              <span className="text-slate-600 font-mono">Median Yield: {medianYield}%</span>
                            ) : (
                              <span className="text-slate-400 italic">Standard Aid Process</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Official Portal Link */}
                    <tr>
                      <td className="p-4 font-semibold text-slate-700 bg-slate-50">Official Link</td>
                      {shortlist.map((prog) => (
                        <td key={prog.programId} className="p-4 border-l border-slate-200">
                          <a
                            href={formatOfficialUrl(prog.officialSourceUrl || `https://${prog.domain}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-royal hover:text-blue-700 font-bold hover:underline"
                          >
                            <span>Open Portal</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center print:hidden">
                <span className="text-xs text-slate-500 font-mono">
                  100% Stateless Zero-Auth Platform • Verified Admissions Knowledge
                </span>
                <button
                  type="button"
                  onClick={() => setIsComparisonOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
                >
                  Close Comparison
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
