'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Columns3, 
  DollarSign, 
  Building2, 
  ShieldCheck, 
  RefreshCw, 
  ArrowRight, 
  TrendingDown, 
  CheckCircle2, 
  Sliders, 
  Filter, 
  Landmark, 
  Lock, 
  AlertCircle, 
  FileCheck, 
  Layers, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Clock, 
  Check, 
  X, 
  Scale, 
  HeartHandshake, 
  Sparkles, 
  Globe2, 
  Coins, 
  Percent, 
  FileText 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { compareCountries, fetchProofOfFundsMatrix, CountryComparisonItem, StatutoryProofOfFundsItem } from '@/lib/api-client';
import { useToast } from '@/components/common/ToastProvider';

export default function ComparisonPage() {
  const { showToast } = useToast();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [maxBudget, setMaxBudget] = useState<number>(40000);
  const [comparisonData, setComparisonData] = useState<CountryComparisonItem[]>([]);
  const [proofOfFundsData, setProofOfFundsData] = useState<StatutoryProofOfFundsItem[]>([]);
  const [scholarshipOffset, setScholarshipOffset] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 5 Active Tabs: 'matrix' | 'proofOfFunds' | 'visaStudio' | 'wageEngine' | 'headToHead'
  const [activeTab, setActiveTab] = useState<'matrix' | 'proofOfFunds' | 'visaStudio' | 'wageEngine' | 'headToHead'>('matrix');

  // Filter Toggles
  const [filterTuitionFreeOnly, setFilterTuitionFreeOnly] = useState<boolean>(false);
  const [filterSpouseAllowedOnly, setFilterSpouseAllowedOnly] = useState<boolean>(false);
  const [filterLongStaybackOnly, setFilterLongStaybackOnly] = useState<boolean>(false); // 24m+
  const [filterFastPrOnly, setFilterFastPrOnly] = useState<boolean>(false); // <= 3yr PR

  // Part-Time Wage Simulator Slider (Hours worked per week)
  const [simulatedWorkHours, setSimulatedWorkHours] = useState<number>(20);

  // Head-to-Head Comparison Pinned Country ISO codes
  const [pinnedCountryCodes, setPinnedCountryCodes] = useState<string[]>(['DE', 'NL', 'GB', 'US']);

  const loadComparison = async () => {
    setIsLoading(true);
    try {
      const [countries, pof] = await Promise.all([
        compareCountries(['DE', 'NL', 'GB', 'US', 'CA', 'AU', 'SE', 'SG', 'FR', 'MY'], selectedCurrency),
        fetchProofOfFundsMatrix(['DE', 'NL', 'GB', 'US', 'CA', 'AU', 'SE', 'SG', 'FR', 'MY'], selectedCurrency, scholarshipOffset),
      ]);
      setComparisonData(countries);
      setProofOfFundsData(pof);
    } catch (err) {
      console.error('Failed to load comparison data:', err);
      showToast('Error Loading Matrix', 'Make sure NestJS backend is active', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComparison();
  }, [selectedCurrency, scholarshipOffset]);

  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    MYR: 'RM',
    CAD: 'C$',
    AUD: 'A$',
    SEK: 'kr',
    SGD: 'S$',
  };

  // Recharts Chart Data formatting
  const chartData = useMemo(() => {
    return comparisonData.map((c) => {
      const avgTuition = (c.tuitionRangeAnnual.min + c.tuitionRangeAnnual.max) / 2;
      const annualLiving = (c.estMonthlyLivingCost || 900) * 12;
      const avgYield = c.tuitionRangeAnnual.min === 0 ? avgTuition : avgTuition * 0.4;
      const netCost = Math.max(0, avgTuition + annualLiving - avgYield);

      return {
        country: c.countryName,
        code: c.isoCode,
        Tuition: Math.round(avgTuition),
        LivingCost: Math.round(annualLiving),
        NetCost: Math.round(netCost),
      };
    });
  }, [comparisonData]);

  // Filtered Countries based on search / filter chips
  const filteredCountries = useMemo(() => {
    return comparisonData.filter((c) => {
      const avgTuition = (c.tuitionRangeAnnual.min + c.tuitionRangeAnnual.max) / 2;
      if (avgTuition > maxBudget && activeTab === 'matrix') return false;
      if (filterTuitionFreeOnly && c.tuitionRangeAnnual.min > 0) return false;
      if (filterSpouseAllowedOnly && !c.industryIntelligence?.spouseWorkAllowed) return false;
      if (filterLongStaybackOnly && (c.visaAndWorkProfile?.postStudyWorkMonths || 0) < 24) return false;
      if (filterFastPrOnly && (c.industryIntelligence?.prTimelineYears || 5) > 3) return false;
      return true;
    });
  }, [comparisonData, maxBudget, activeTab, filterTuitionFreeOnly, filterSpouseAllowedOnly, filterLongStaybackOnly, filterFastPrOnly]);

  // Pinned countries for Head-to-Head table
  const headToHeadCountries = useMemo(() => {
    return comparisonData.filter((c) => pinnedCountryCodes.includes(c.isoCode));
  }, [comparisonData, pinnedCountryCodes]);

  const togglePinCountry = (iso: string) => {
    if (pinnedCountryCodes.includes(iso)) {
      if (pinnedCountryCodes.length <= 2) {
        showToast('Minimum 2 Countries', 'Head-to-head comparison requires at least 2 destinations', 'info');
        return;
      }
      setPinnedCountryCodes(pinnedCountryCodes.filter((c) => c !== iso));
    } else {
      if (pinnedCountryCodes.length >= 4) {
        showToast('Maximum 4 Countries', 'You can compare up to 4 countries simultaneously', 'info');
        return;
      }
      setPinnedCountryCodes([...pinnedCountryCodes, iso]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-royal text-xs font-semibold mb-4 shadow-sm font-mono">
          <Globe2 className="w-3.5 h-3.5 text-royal" />
          Industry-Grade Higher Education & Immigration Decision Studio
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-outfit text-slate-navy mb-3">
          Multi-Country Comparison Studio
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Side-by-side FX normalized breakdown of annual master’s tuition, statutory blocked account (Sperrkonto) escrow mandates, student minimum wage economics, spousal work policies, and fast-track PR settlement pathways.
        </p>
      </div>

      {/* Main 5-Tab Navigation Ribbon */}
      <div className="flex justify-center mb-8 overflow-x-auto pb-2">
        <div className="p-1.5 rounded-2xl bg-slate-100 border border-slate-200 flex items-center gap-1 text-xs font-bold font-outfit shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-white text-royal shadow-md'
                : 'text-slate-600 hover:text-royal'
            }`}
          >
            <Columns3 className="w-4 h-4" />
            <span>Cost & Tuition Matrix</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('proofOfFunds')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'proofOfFunds'
                ? 'bg-gradient-to-r from-blue-600 to-royal text-white shadow-md'
                : 'text-slate-600 hover:text-royal'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Statutory Blocked Account (Sperrkonto)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('visaStudio')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'visaStudio'
                ? 'bg-gradient-to-r from-blue-600 to-royal text-white shadow-md'
                : 'text-slate-600 hover:text-royal'
            }`}
          >
            <Briefcase className="w-4 h-4 text-emerald-500" />
            <span>Work Rights & PR Studio</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wageEngine')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'wageEngine'
                ? 'bg-gradient-to-r from-blue-600 to-royal text-white shadow-md'
                : 'text-slate-600 hover:text-royal'
            }`}
          >
            <Coins className="w-4 h-4 text-amber-500" />
            <span>Part-Time Wage & Tax Engine</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('headToHead')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'headToHead'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-royal'
            }`}
          >
            <Scale className="w-4 h-4 text-cyan-400" />
            <span>Head-to-Head Diff Matrix</span>
          </button>
        </div>
      </div>

      {/* Global Interactive Controls Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 mb-8 space-y-4 shadow-xl bg-white">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Currency Switcher */}
          <div className="md:col-span-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-700 font-mono font-bold flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-royal" />
              Live FX Currency:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SEK', 'SGD', 'MYR'].map((curr) => (
                <button
                  key={curr}
                  onClick={() => {
                    setSelectedCurrency(curr);
                    showToast('Currency Updated', `Display values converted to ${curr}`, 'info');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                    selectedCurrency === curr
                      ? 'bg-gradient-to-r from-blue-600 to-royal text-white shadow-md'
                      : 'bg-white border border-slate-200 text-slate-700 hover:text-royal hover:bg-slate-50'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Slider (Budget or Scholarship Offset or Work Hours) */}
          <div className="md:col-span-6 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
            {activeTab === 'matrix' && (
              <>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-500 font-mono uppercase font-bold tracking-wider flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-royal" /> Max Tuition Budget
                  </span>
                  <span className="text-royal font-mono font-extrabold text-sm">
                    {currencySymbols[selectedCurrency] || ''}
                    {maxBudget.toLocaleString()} {selectedCurrency}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60000"
                  step="2500"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(parseFloat(e.target.value))}
                  className="w-full accent-royal bg-slate-200 rounded-lg cursor-pointer h-2"
                />
              </>
            )}

            {activeTab === 'proofOfFunds' && (
              <>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-emerald-700 font-mono uppercase font-bold tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Scholarship Award Offset
                  </span>
                  <span className="text-emerald-700 font-mono font-extrabold text-sm">
                    {currencySymbols[selectedCurrency] || ''}
                    {scholarshipOffset.toLocaleString()} {selectedCurrency} / yr
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25000"
                  step="1000"
                  value={scholarshipOffset}
                  onChange={(e) => setScholarshipOffset(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 bg-slate-200 rounded-lg cursor-pointer h-2"
                />
                <span className="text-[10px] text-slate-400 block font-mono">
                  Deducts scholarship stipend dollar-for-dollar from legal visa blocked account deposit.
                </span>
              </>
            )}

            {activeTab === 'wageEngine' && (
              <>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-amber-800 font-mono uppercase font-bold tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Simulated In-Study Work Hours
                  </span>
                  <span className="text-amber-800 font-mono font-extrabold text-sm">
                    {simulatedWorkHours} Hours / Week
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="2"
                  value={simulatedWorkHours}
                  onChange={(e) => setSimulatedWorkHours(Number(e.target.value))}
                  className="w-full accent-amber-600 bg-slate-200 rounded-lg cursor-pointer h-2"
                />
                <span className="text-[10px] text-slate-400 block font-mono">
                  Calculates gross monthly earnings based on statutory student minimum wage per country.
                </span>
              </>
            )}

            {(activeTab === 'visaStudio' || activeTab === 'headToHead') && (
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-600">Active Destinations Tracked:</span>
                <strong className="text-royal font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {comparisonData.length} Global Countries
                </strong>
              </div>
            )}
          </div>
        </div>

        {/* Quick Decision Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-mono font-bold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Matrix:
          </span>
          <button
            type="button"
            onClick={() => setFilterTuitionFreeOnly(!filterTuitionFreeOnly)}
            className={`px-3 py-1 rounded-xl font-bold transition-all border ${
              filterTuitionFreeOnly
                ? 'bg-blue-50 text-royal border-blue-300 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-royal'
            }`}
          >
            🎓 Tuition-Free Public Only
          </button>
          <button
            type="button"
            onClick={() => setFilterSpouseAllowedOnly(!filterSpouseAllowedOnly)}
            className={`px-3 py-1 rounded-xl font-bold transition-all border ${
              filterSpouseAllowedOnly
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
            }`}
          >
            💍 Spouse Work Allowed
          </button>
          <button
            type="button"
            onClick={() => setFilterLongStaybackOnly(!filterLongStaybackOnly)}
            className={`px-3 py-1 rounded-xl font-bold transition-all border ${
              filterLongStaybackOnly
                ? 'bg-cyan-50 text-cyan-800 border-cyan-300 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-300'
            }`}
          >
            ⏳ 2+ Years Stayback
          </button>
          <button
            type="button"
            onClick={() => setFilterFastPrOnly(!filterFastPrOnly)}
            className={`px-3 py-1 rounded-xl font-bold transition-all border ${
              filterFastPrOnly
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
            }`}
          >
            ⚡ Fast-Track PR (≤ 3 yrs)
          </button>
          {(filterTuitionFreeOnly || filterSpouseAllowedOnly || filterLongStaybackOnly || filterFastPrOnly) && (
            <button
              type="button"
              onClick={() => {
                setFilterTuitionFreeOnly(false);
                setFilterSpouseAllowedOnly(false);
                setFilterLongStaybackOnly(false);
                setFilterFastPrOnly(false);
              }}
              className="text-[11px] font-mono text-royal underline ml-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TUITION & COST MATRIX VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <>
          {/* Visual Chart Comparison */}
          {comparisonData.length > 0 && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 mb-10 shadow-xl bg-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold font-outfit text-slate-navy">
                    Annual Expense & Net Cost Comparison
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Values normalized in {selectedCurrency} ({currencySymbols[selectedCurrency] || '$'})
                  </p>
                </div>
                {isLoading && <RefreshCw className="w-4 h-4 text-royal animate-spin" />}
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="country" tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        borderColor: '#E2E8F0',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                      formatter={(value: any) => [`${currencySymbols[selectedCurrency] || ''}${Number(value).toLocaleString()}`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="Tuition" fill="#2563EB" radius={[6, 6, 0, 0]} name="Average Annual Tuition" />
                    <Bar dataKey="LivingCost" fill="#64748B" radius={[6, 6, 0, 0]} name="Annual Living Expenses" />
                    <Bar dataKey="NetCost" fill="#10B981" radius={[6, 6, 0, 0]} name="Net Out-of-Pocket Cost" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Country Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCountries.map((country) => (
              <motion.div
                key={country.isoCode}
                whileHover={{ y: -4 }}
                className="glass-panel p-6 rounded-3xl border border-slate-200 hover:border-royal transition-all flex flex-col justify-between shadow-lg bg-white"
              >
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-2xl font-bold font-outfit text-slate-navy">{country.countryName}</h3>
                      <span className="text-xs text-slate-500 font-mono font-semibold">{country.regionName}</span>
                    </div>
                    <span className="text-xl font-black font-mono px-3 py-1 rounded-xl bg-blue-50 text-royal border border-blue-200">
                      {country.isoCode}
                    </span>
                  </div>

                  <div className="space-y-4 mb-6">
                    {/* Tuition Range */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1 shadow-sm">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block">Annual Master’s Tuition</span>
                      <span className="text-lg font-bold font-mono text-royal">
                        {country.tuitionRangeAnnual.min === 0
                          ? `Free (0 ${selectedCurrency})`
                          : `${country.tuitionRangeAnnual.min.toLocaleString()} - ${country.tuitionRangeAnnual.max.toLocaleString()} ${selectedCurrency}`}
                      </span>
                    </div>

                    {/* Monthly Living Cost */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1 shadow-sm">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block">Est. Monthly Living Cost</span>
                      <span className="text-lg font-bold font-mono text-slate-800">
                        ~{country.estMonthlyLivingCost.toLocaleString()} {selectedCurrency} / month
                      </span>
                    </div>

                    {/* Post-Study Work & Immigration Profile */}
                    {country.visaAndWorkProfile && (
                      <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 text-xs font-mono space-y-2">
                        <div className="flex justify-between items-center border-b border-emerald-200/60 pb-1.5">
                          <span className="text-emerald-900 font-bold">Post-Study Work Visa:</span>
                          <span className="text-emerald-950 font-extrabold px-2 py-0.5 rounded-md bg-emerald-200/70 text-[11px]">
                            {country.visaAndWorkProfile.postStudyWorkMonths} Months
                          </span>
                        </div>

                        <div className="text-[11px] text-emerald-800 space-y-1">
                          <p><strong>Permit:</strong> {country.visaAndWorkProfile.permitName}</p>
                          <p><strong>In-Study Work:</strong> {country.visaAndWorkProfile.inStudyWorkHoursWeekly} hrs/week | <strong>Spouse:</strong> {country.industryIntelligence?.spouseWorkAllowed ? '✅ Work Allowed' : '❌ Restricted'}</p>
                          <p><strong>PR Pathway:</strong> {country.visaAndWorkProfile.pathwayToPR}</p>
                        </div>

                        <div className="pt-1.5 border-t border-emerald-200/60 flex justify-between items-center text-[11px]">
                          <span className="text-emerald-900">Median Grad Salary:</span>
                          <strong className="text-emerald-950 font-extrabold">
                            {currencySymbols[selectedCurrency] || ''}{country.visaAndWorkProfile.medianGraduateSalary?.toLocaleString()} / yr
                          </strong>
                        </div>

                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-emerald-900">Estimated Payback:</span>
                          <strong className="text-emerald-950 font-extrabold bg-emerald-200 px-2 py-0.5 rounded">
                            ~{country.visaAndWorkProfile.estimatedPaybackYears} Years
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      togglePinCountry(country.isoCode);
                      setActiveTab('headToHead');
                    }}
                    className="text-xs font-mono font-bold text-royal hover:underline flex items-center gap-1"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Compare Diff</span>
                  </button>
                  <a
                    href={`/search?country=${country.isoCode}`}
                    className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-royal hover:text-white text-royal text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                  >
                    Find Programs →
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STATUTORY BLOCKED ACCOUNT (SPERRKONTO / PROOF OF FUNDS) */}
      {/* ========================================================================= */}
      {activeTab === 'proofOfFunds' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-blue-900 text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-700/80 text-blue-200 text-xs font-mono font-bold mb-2">
                <Lock className="w-3.5 h-3.5 text-amber-300" /> Legal Visa Mandate
              </span>
              <h2 className="text-2xl font-extrabold font-outfit">
                Statutory Student Visa Blocked Account Minimums (Sperrkonto)
              </h2>
              <p className="text-xs text-blue-200 max-w-2xl mt-1">
                Foreign immigration authorities mandate locked escrow deposits to issue student residence permits. All values calculated in {selectedCurrency} with live exchange rates and scholarship offset deductions.
              </p>
            </div>
            {scholarshipOffset > 0 && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl text-xs font-mono text-emerald-300 shrink-0">
                <span>Scholarship Offset Applied:</span>
                <strong className="block text-emerald-100 text-sm">
                  -{currencySymbols[selectedCurrency] || ''}{scholarshipOffset.toLocaleString()} {selectedCurrency}
                </strong>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proofOfFundsData.map((pof) => {
              const isWaived = pof.netBlockedDepositAfterScholarship?.isFullyWaivedByScholarship;
              const netDeposit = pof.netBlockedDepositAfterScholarship?.netBlockedDepositRequired ?? pof.totalStatutoryDepositRequired;

              return (
                <motion.div
                  key={pof.countryIsoCode}
                  whileHover={{ y: -4 }}
                  className="glass-panel p-6 rounded-3xl border border-slate-200 hover:border-royal transition-all flex flex-col justify-between shadow-lg bg-white"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-xl font-bold font-outfit text-slate-navy">{pof.countryName}</h3>
                        <span className="text-[11px] font-mono text-slate-500">{pof.permitRegulationName}</span>
                      </div>
                      <span className="text-lg font-black font-mono px-3 py-1 rounded-xl bg-blue-50 text-royal border border-blue-200">
                        {pof.countryIsoCode}
                      </span>
                    </div>

                    {/* Net Blocked Account Total */}
                    <div className={`p-4 rounded-2xl border space-y-1 ${
                      isWaived
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-slate-50 border-slate-200 shadow-sm'
                    }`}>
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">
                        Total Statutory Visa Escrow Required
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-extrabold font-mono ${isWaived ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {isWaived ? '0 (Fully Waived)' : `${currencySymbols[selectedCurrency] || ''}${netDeposit.toLocaleString()} ${selectedCurrency}`}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block font-mono">
                        Native: {pof.statutoryAnnualLocal.toLocaleString()} {pof.nativeCurrency} ({pof.durationMonthsRequired} Months @ {pof.statutoryMonthlyLocal.toLocaleString()} {pof.nativeCurrency}/mo)
                      </span>
                    </div>

                    {/* Fee Stack Breakdown */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs font-mono space-y-2">
                      <div className="flex justify-between text-slate-700">
                        <span>Statutory Living Funds ({pof.durationMonthsRequired} mos):</span>
                        <strong className="text-slate-900">{currencySymbols[selectedCurrency] || ''}{pof.statutoryAnnualConverted.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Mandatory Health Insurance:</span>
                        <strong className="text-slate-900">+{currencySymbols[selectedCurrency] || ''}{pof.mandatoryInsuranceBufferConverted.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Recommended 3% FX Buffer:</span>
                        <strong className="text-slate-900">+{currencySymbols[selectedCurrency] || ''}{pof.recommendedFxBufferConverted.toLocaleString()}</strong>
                      </div>

                      {scholarshipOffset > 0 && (
                        <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                          <span>Scholarship Offset Deduction:</span>
                          <span>-{currencySymbols[selectedCurrency] || ''}{pof.netBlockedDepositAfterScholarship?.scholarshipAnnualStipend.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5 text-royal" /> Official Embassy Standard
                    </span>
                    <a
                      href={`/search?country=${pof.countryIsoCode}`}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-royal hover:text-white text-royal text-xs font-bold transition-all"
                    >
                      View Programs →
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: POST-STUDY WORK, VISA & IMMIGRATION STUDIO */}
      {/* ========================================================================= */}
      {activeTab === 'visaStudio' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-navy to-blue-950 text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-mono font-bold mb-2">
                <Briefcase className="w-3.5 h-3.5" /> Immigration & Stayback Intelligence
              </span>
              <h2 className="text-2xl font-extrabold font-outfit">
                Post-Study Work Permits & PR Settlement Trajectories
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl mt-1">
                Comparative analysis of post-study stayback terms, in-study working regulations, 2024–2026 spousal work policy changes, and fast-track permanent residency (PR) requirements.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCountries.map((country) => {
              const intel = country.industryIntelligence;
              const visa = country.visaAndWorkProfile;

              return (
                <div
                  key={country.isoCode}
                  className="glass-panel p-6 rounded-3xl border border-slate-200 shadow-lg bg-white flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold font-outfit text-slate-navy">{country.countryName}</h3>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-royal border border-blue-200">
                            {country.isoCode}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">{visa?.permitName || 'Standard Post-Graduation Permit'}</span>
                      </div>
                      <span className="text-sm font-extrabold font-outfit bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl">
                        {visa?.postStudyWorkMonths} Months Stayback
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">In-Study Work Permitted</span>
                        <strong className="text-slate-800 block text-[11px] leading-tight">
                          {intel?.inStudyWorkLimitFormatted || `${visa?.inStudyWorkHoursWeekly} hrs/week`}
                        </strong>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">Spousal Work Rights</span>
                        <strong className={`block text-[11px] leading-tight ${intel?.spouseWorkAllowed ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {intel?.spouseWorkAllowed ? '✅ Open Work Permit' : '❌ Restricted / Separate Pass'}
                        </strong>
                        <span className="text-[10px] text-slate-500 line-clamp-2">{intel?.spousalWorkRightsPolicy}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs font-mono space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-royal font-bold uppercase text-[10px]">Permanent Residency Pathway:</span>
                        <span className="bg-royal text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          ~{intel?.prTimelineYears} Years Fast-Track
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-relaxed">
                        {intel?.permanentResidencyPathway || visa?.pathwayToPR}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-xs font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-slate-500">English Job Environment:</span>
                      <strong className="text-slate-900">{intel?.englishProficiencyRank || 'High'}</strong>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => {
                        togglePinCountry(country.isoCode);
                        setActiveTab('headToHead');
                      }}
                      className="text-xs font-mono font-bold text-royal hover:underline flex items-center gap-1"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Pin to Head-to-Head</span>
                    </button>
                    <a
                      href={`/search?country=${country.isoCode}`}
                      className="px-4 py-1.5 rounded-xl bg-royal text-white text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1 shadow-sm"
                    >
                      Explore Programs →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: STUDENT PART-TIME WAGE & TAX ENGINE */}
      {/* ========================================================================= */}
      {activeTab === 'wageEngine' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-slate-navy text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-mono font-bold mb-2">
                <Coins className="w-3.5 h-3.5" /> Student Cashflow Economics
              </span>
              <h2 className="text-2xl font-extrabold font-outfit">
                Statutory Student Minimum Wages & In-Study Earnings Engine
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl mt-1">
                Simulate your legal part-time student earnings during study semesters across all countries. Calculations reflect statutory minimum wages, tax-free brackets, and living cost offset capacity at {simulatedWorkHours} hrs/week.
              </p>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl text-xs font-mono border border-white/10 shrink-0">
              <span className="text-slate-300 block text-[10px]">Simulated Pace:</span>
              <strong className="text-amber-300 text-sm font-bold">{simulatedWorkHours} hrs/week (4.2 wks/mo)</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCountries.map((country) => {
              const intel = country.industryIntelligence;
              const hourlyConverted = intel?.studentMinWageHourlyConverted || 12;
              const monthlyEarningsConverted = Math.round(hourlyConverted * simulatedWorkHours * 4.2);
              const livingCost = country.estMonthlyLivingCost || 1000;
              const coveragePct = Math.min(100, Math.round((monthlyEarningsConverted / livingCost) * 100));

              return (
                <div
                  key={country.isoCode}
                  className="glass-panel p-6 rounded-3xl border border-slate-200 shadow-lg bg-white flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-xl font-bold font-outfit text-slate-navy">{country.countryName}</h3>
                        <span className="text-xs text-slate-500 font-mono">
                          Min. Wage: {intel?.studentMinWageHourlyLocal.toFixed(2)} {intel?.minWageCurrency}/hr
                        </span>
                      </div>
                      <span className="text-base font-bold font-mono px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
                        {country.isoCode}
                      </span>
                    </div>

                    {/* Simulated Gross Earnings Box */}
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-1.5">
                      <span className="text-[10px] uppercase font-mono font-bold text-amber-900 block">
                        Estimated Monthly In-Study Pay ({simulatedWorkHours}h/wk)
                      </span>
                      <div className="text-2xl font-extrabold font-mono text-amber-950">
                        {currencySymbols[selectedCurrency] || ''}{monthlyEarningsConverted.toLocaleString()} {selectedCurrency} / mo
                      </div>
                      <div className="text-[11px] text-amber-800 font-mono flex justify-between pt-1 border-t border-amber-200/60">
                        <span>Living Cost Coverage:</span>
                        <strong className="text-amber-950 font-bold">{coveragePct}% of Expenses</strong>
                      </div>
                    </div>

                    {/* Tax & Work Breakdown */}
                    <div className="space-y-2 text-xs font-mono bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Hourly Normalized Wage:</span>
                        <strong className="text-slate-900">{currencySymbols[selectedCurrency] || ''}{hourlyConverted.toFixed(2)} / hr</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tax-Free Personal Bracket:</span>
                        <strong className="text-emerald-700">{intel?.taxFreeAllowanceAnnualLocal.toLocaleString()} {intel?.minWageCurrency}/yr</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Mandatory Health Cost:</span>
                        <strong className="text-slate-800">~{currencySymbols[selectedCurrency] || ''}{intel?.mandatoryHealthcareMonthlyConverted}/mo</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[11px] font-mono text-slate-500">
                      {intel?.housingStrainIndex} Rent Strain Index
                    </span>
                    <a
                      href={`/search?country=${country.isoCode}`}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-royal transition-all"
                    >
                      View Programs →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: HEAD-TO-HEAD PINNED DIFF MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'headToHead' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-mono font-bold mb-2">
                <Scale className="w-3.5 h-3.5" /> Pinned Head-to-Head Comparison
              </span>
              <h2 className="text-2xl font-extrabold font-outfit">
                Direct Side-by-Side Country Diff Matrix
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl mt-1">
                Select 2 to 4 destination countries below to contrast tuition, escrow laws, in-study work limits, spousal rights, and settlement speed in a unified diff table.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export Matrix PDF</span>
            </button>
          </div>

          {/* Country Selection Multi-Pin Selector */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-700 mr-2">Pinned ({headToHeadCountries.length}/4):</span>
            {comparisonData.map((c) => {
              const isPinned = pinnedCountryCodes.includes(c.isoCode);
              return (
                <button
                  key={c.isoCode}
                  type="button"
                  onClick={() => togglePinCountry(c.isoCode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border ${
                    isPinned
                      ? 'bg-royal text-white border-royal shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-royal'
                  }`}
                >
                  <span>{c.countryName} ({c.isoCode})</span>
                  {isPinned ? <Check className="w-3.5 h-3.5" /> : <span className="text-slate-400">+</span>}
                </button>
              );
            })}
          </div>

          {/* Side-by-Side Unified Diff Matrix Table */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 overflow-x-auto shadow-xl bg-white">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="p-4 bg-slate-50 font-mono text-xs font-bold text-slate-600 uppercase tracking-wider w-1/5">
                    Metric / Criterion
                  </th>
                  {headToHeadCountries.map((c) => (
                    <th key={c.isoCode} className="p-4 bg-blue-50/40 border-l border-slate-200 w-1/4 align-top">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-royal uppercase block">{c.continentName}</span>
                          <h4 className="text-base font-extrabold font-outfit text-slate-900">{c.countryName}</h4>
                          <span className="text-xs font-mono text-slate-500 font-semibold">{c.isoCode} • {c.nativeCurrency}</span>
                        </div>
                        <button
                          onClick={() => togglePinCountry(c.isoCode)}
                          className="text-slate-400 hover:text-red-500 p-1"
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-mono">
                {/* 1. Annual Tuition Fee */}
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50">Annual Master’s Tuition</td>
                  {headToHeadCountries.map((c) => (
                    <td key={c.isoCode} className="p-4 border-l border-slate-200 font-bold text-royal">
                      {c.tuitionRangeAnnual.min === 0
                        ? 'Tuition Free (€0 Public)'
                        : `${currencySymbols[selectedCurrency] || ''}${c.tuitionRangeAnnual.min.toLocaleString()} - ${c.tuitionRangeAnnual.max.toLocaleString()}`}
                    </td>
                  ))}
                </tr>

                {/* 2. Monthly Living Cost */}
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50">Est. Monthly Living Cost</td>
                  {headToHeadCountries.map((c) => (
                    <td key={c.isoCode} className="p-4 border-l border-slate-200 text-slate-800">
                      {currencySymbols[selectedCurrency] || ''}{c.estMonthlyLivingCost.toLocaleString()} / mo
                    </td>
                  ))}
                </tr>

                {/* 3. Post-Grad Stayback */}
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50">Post-Study Stayback</td>
                  {headToHeadCountries.map((c) => (
                    <td key={c.isoCode} className="p-4 border-l border-slate-200">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        {c.visaAndWorkProfile?.postStudyWorkMonths} Months
                      </span>
                    </td>
                  ))}
                </tr>

                {/* 4. In-Study Work Limits */}
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50">In-Study Work Allowed</td>
                  {headToHeadCountries.map((c) => (
                    <td key={c.isoCode} className="p-4 border-l border-slate-200 text-slate-700">
                      {c.industryIntelligence?.inStudyWorkLimitFormatted}
                    </td>
                  ))}
                </tr>

                {/* 5. Student Minimum Hourly Wage */}
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50">Student Minimum Wage</td>
                  {headToHeadCountries.map((c) => (
                    <td key={c.isoCode} className="p-4 border-l border-slate-200 font-bold text-amber-900">
                      {currencySymbols[selectedCurrency] || ''}{c.industryIntelligence?.studentMinWageHourlyConverted.toFixed(2)}/hr ({c.industryIntelligence?.studentMinWageHourlyLocal} {c.industryIntelligence?.minWageCurrency})
                    </td>
                  ))}
                </tr>

                {/* 6. Spousal Work Rights */}
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50">Spousal Work Rights</td>
                  {headToHeadCountries.map((c) => (
                    <td key={c.isoCode} className="p-4 border-l border-slate-200">
                      <span className={`font-bold ${c.industryIntelligence?.spouseWorkAllowed ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {c.industryIntelligence?.spouseWorkAllowed ? '✅ Open Work Permit' : '❌ Restricted'}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* 7. Fast-Track PR Timeline */}
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50">Permanent Residency (PR)</td>
                  {headToHeadCountries.map((c) => (
                    <td key={c.isoCode} className="p-4 border-l border-slate-200 text-slate-700">
                      <strong className="text-royal block mb-1">~{c.industryIntelligence?.prTimelineYears} Years Fast-Track</strong>
                      <span className="text-[10px] text-slate-500 leading-tight block">{c.industryIntelligence?.permanentResidencyPathway}</span>
                    </td>
                  ))}
                </tr>

                {/* 8. Mandatory Healthcare Cost */}
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50">Mandatory Healthcare Insurance</td>
                  {headToHeadCountries.map((c) => (
                    <td key={c.isoCode} className="p-4 border-l border-slate-200 text-slate-800">
                      {c.industryIntelligence?.mandatoryHealthcareMonthlyConverted === 0 ? (
                        <span className="text-emerald-700 font-bold">Free National Coverage (€0)</span>
                      ) : (
                        <span>{currencySymbols[selectedCurrency] || ''}{c.industryIntelligence?.mandatoryHealthcareMonthlyConverted}/mo</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* 9. Median Starting Salary */}
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50">Median Graduate Salary</td>
                  {headToHeadCountries.map((c) => (
                    <td key={c.isoCode} className="p-4 border-l border-slate-200 font-bold text-emerald-800 text-sm">
                      {currencySymbols[selectedCurrency] || ''}{c.visaAndWorkProfile?.medianGraduateSalary?.toLocaleString()} / yr
                    </td>
                  ))}
                </tr>

                {/* 10. Estimated Degree Payback */}
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50">Estimated Payback Period</td>
                  {headToHeadCountries.map((c) => (
                    <td key={c.isoCode} className="p-4 border-l border-slate-200 font-bold text-slate-900">
                      ~{c.visaAndWorkProfile?.estimatedPaybackYears} Years
                    </td>
                  ))}
                </tr>

                {/* 11. Program Finder Link */}
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50">Catalog Action</td>
                  {headToHeadCountries.map((c) => (
                    <td key={c.isoCode} className="p-4 border-l border-slate-200">
                      <a
                        href={`/search?country=${c.isoCode}`}
                        className="inline-flex items-center gap-1 text-royal font-bold hover:underline"
                      >
                        <span>Find {c.countryName} Programs</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
