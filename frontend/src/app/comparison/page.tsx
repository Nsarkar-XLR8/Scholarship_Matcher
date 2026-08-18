'use client';

import React, { useEffect, useState } from 'react';
import { Columns3, DollarSign, Building2, ShieldCheck, RefreshCw, ArrowRight, TrendingDown, CheckCircle2, Sliders, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { compareCountries } from '@/lib/api-client';
import { useToast } from '@/components/common/ToastProvider';

export default function ComparisonPage() {
  const { showToast } = useToast();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [maxBudget, setMaxBudget] = useState<number>(40000);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadComparison = async () => {
    setIsLoading(true);
    try {
      const data = await compareCountries(['DE', 'NL', 'GB', 'US', 'MY'], selectedCurrency);
      setComparisonData(data);
    } catch (err) {
      console.error('Failed to load comparison data:', err);
      showToast('Error Loading Matrix', 'Make sure NestJS backend is active', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComparison();
  }, [selectedCurrency]);

  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    MYR: 'RM',
    CAD: 'C$',
    AUD: 'A$',
  };

  // Recharts Chart Data formatting
  const chartData = comparisonData.map((c) => {
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

  const filteredCountries = comparisonData.filter((c) => {
    const avgTuition = (c.tuitionRangeAnnual.min + c.tuitionRangeAnnual.max) / 2;
    return avgTuition <= maxBudget;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold mb-4 shadow-sm">
          <Columns3 className="w-3.5 h-3.5 text-amber-600" />
          Live FX Normalized Cost & Tuition Matrix
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-outfit text-slate-navy mb-3">
          Multi-Country Comparison Matrix
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Side-by-side FX normalized breakdown of annual master’s tuition ranges, estimated living costs, and average scholarship yield per destination.
        </p>
      </div>

      {/* Interactive Controls Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center shadow-xl">
        {/* Currency Switcher */}
        <div className="md:col-span-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-slate-700 font-mono font-bold flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-royal" />
            Display Currency FX:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {['USD', 'EUR', 'GBP', 'MYR', 'CAD', 'AUD'].map((curr) => (
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

        {/* Budget Filter Slider */}
        <div className="md:col-span-6 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
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
        </div>
      </div>

      {/* Visual Chart Comparison */}
      {comparisonData.length > 0 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 mb-10 shadow-xl">
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
            className="glass-panel p-6 rounded-3xl border border-slate-200 hover:border-royal transition-all flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-2xl font-bold font-outfit text-slate-navy">{country.countryName}</h3>
                  <span className="text-xs text-slate-500 font-mono font-semibold">{country.regionName}</span>
                </div>
                <span className="text-xl font-black font-mono px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                  {country.isoCode}
                </span>
              </div>

              <div className="space-y-4 mb-6">
                {/* Tuition Range */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1 shadow-sm">
                  <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block">Annual Master’s Tuition</span>
                  <span className="text-lg font-bold font-mono text-royal">
                    {country.tuitionRangeAnnual.min === 0
                      ? `Free (0 ${selectedCurrency})`
                      : `${country.tuitionRangeAnnual.min.toLocaleString()} - ${country.tuitionRangeAnnual.max.toLocaleString()} ${selectedCurrency}`}
                  </span>
                </div>

                {/* Monthly Living Cost */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1 shadow-sm">
                  <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block">Est. Monthly Living Cost</span>
                  <span className="text-lg font-bold font-mono text-slate-800">
                    ~{country.estMonthlyLivingCost.toLocaleString()} {selectedCurrency} / month
                  </span>
                </div>

                {/* Scope Coverage */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Active Rules:</span>
                    <span className="text-slate-900 font-bold">{country.totalScholarshipRules} Rules</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Post-Grad Work Permit:</span>
                    <span className="text-emerald-700 font-bold">18-36 Months</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> UN M49 Verified
              </span>
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
    </div>
  );
}
