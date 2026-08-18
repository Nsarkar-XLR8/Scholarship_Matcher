'use client';

import React, { useEffect, useState } from 'react';
import { Columns3, DollarSign, Building2, ShieldCheck, RefreshCw, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { compareCountries } from '@/lib/api-client';

export default function ComparisonPage() {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadComparison = async () => {
    setIsLoading(true);
    try {
      const data = await compareCountries(['DE', 'NL', 'GB', 'US', 'MY'], selectedCurrency);
      setComparisonData(data);
    } catch (err) {
      console.error('Failed to load comparison data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComparison();
  }, [selectedCurrency]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono mb-4 shadow-sm">
          <Columns3 className="w-3.5 h-3.5 text-amber-600" />
          Live FX Normalized Cost & Tuition Matrix
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-outfit text-slate-navy mb-3">
          Multi-Country Comparison
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Side-by-side comparison of annual tuition ranges, monthly living cost estimates, and government/university scholarship rules.
        </p>
      </div>

      {/* Currency Selector Control */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 mb-8 flex items-center justify-between shadow-md">
        <span className="text-xs text-slate-700 font-mono font-bold flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-royal" />
          Display Currency Normalization:
        </span>
        <div className="flex gap-2">
          {['USD', 'EUR', 'GBP', 'MYR'].map((curr) => (
            <button
              key={curr}
              onClick={() => setSelectedCurrency(curr)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                selectedCurrency === curr
                  ? 'bg-gradient-to-r from-blue-600 to-royal text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:text-royal'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {comparisonData.map((country) => (
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
                    {country.tuitionRangeAnnual.min === 0 ? 'Free (0)' : country.tuitionRangeAnnual.min.toLocaleString()} - {country.tuitionRangeAnnual.max.toLocaleString()} {country.displayCurrency}
                  </span>
                </div>

                {/* Monthly Living Cost */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1 shadow-sm">
                  <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block">Est. Monthly Living Cost</span>
                  <span className="text-lg font-bold font-mono text-slate-800">
                    ~{country.estMonthlyLivingCost.toLocaleString()} {country.displayCurrency} / month
                  </span>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-50 p-2.5 rounded-xl text-center border border-slate-200">
                    <span className="block text-[10px] text-slate-500 font-bold">Universities</span>
                    <span className="font-bold text-slate-900">{country.universitiesCount}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl text-center border border-slate-200">
                    <span className="block text-[10px] text-slate-500 font-bold">Country Rules</span>
                    <span className="font-bold text-amber-800">{country.countryScholarshipsCount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Completeness Bar:</span>
              <span className="text-royal font-extrabold">{country.dataCompletenessPct}%</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
