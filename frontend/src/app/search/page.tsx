'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Globe, BookOpen, Award, CheckCircle, RefreshCw, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { searchPrograms } from '@/lib/api-client';

export default function SearchPage() {
  const [query, setQuery] = useState<string>('');
  const [countryIsoCode, setCountryIsoCode] = useState<string>('');
  const [fieldOfStudy, setFieldOfStudy] = useState<string>('');
  const [maxGpa, setMaxGpa] = useState<number>(4.0);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    try {
      const data = await searchPrograms({
        query: query || undefined,
        countryIsoCode: countryIsoCode || undefined,
        fieldOfStudy: fieldOfStudy || undefined,
        maxGpaRequirement: maxGpa < 4.0 ? maxGpa : undefined,
        limit: 30,
      });
      setSearchResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      {/* Search Header */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-royal text-xs font-mono mb-4 shadow-sm">
          <Layers className="w-3.5 h-3.5 text-royal" />
          Faceted OpenSearch Cluster & Fallback Query Engine
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-outfit text-slate-navy mb-3">
          Explore Master’s Programs
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Filter thousands of programs across countries, fields of study, minimum GPA requirements, and scholarship availability.
        </p>
      </div>

      {/* Search & Filter Control Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 mb-10 space-y-4 shadow-xl">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keyword, university, or program title..."
              className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-900 font-semibold focus:border-royal focus:outline-none shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-royal text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-500/25 hover:scale-105 transition-transform shrink-0 flex items-center justify-center gap-2"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Search Catalog</span>
          </button>
        </form>

        {/* Facet Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
          {/* Country Facet */}
          <div>
            <label className="block text-xs text-slate-500 font-mono uppercase font-bold mb-1">Filter Country</label>
            <select
              value={countryIsoCode}
              onChange={(e) => setCountryIsoCode(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-royal shadow-sm"
            >
              <option value="">All Countries</option>
              <option value="DE">Germany 🇩🇪</option>
              <option value="NL">Netherlands 🇳🇱</option>
              <option value="GB">United Kingdom 🇬🇧</option>
              <option value="US">United States 🇺🇸</option>
              <option value="MY">Malaysia 🇲🇾</option>
            </select>
          </div>

          {/* Field Facet */}
          <div>
            <label className="block text-xs text-slate-500 font-mono uppercase font-bold mb-1">Field of Study</label>
            <input
              type="text"
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value)}
              placeholder="e.g. Computer Science"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-royal shadow-sm"
            />
          </div>

          {/* Max GPA Facet */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-500 font-mono uppercase font-bold">Max Min-GPA</span>
              <span className="text-royal font-mono font-bold">{maxGpa} / 4.0</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="4.0"
              step="0.1"
              value={maxGpa}
              onChange={(e) => setMaxGpa(parseFloat(e.target.value))}
              className="w-full accent-royal bg-slate-200 rounded-lg cursor-pointer h-2 mt-2"
            />
          </div>
        </div>
      </div>

      {/* Results Header */}
      {searchResults && (
        <div className="flex items-center justify-between mb-6 px-2">
          <span className="text-xs text-slate-500 font-mono">
            Showing <strong className="text-slate-navy">{searchResults.items?.length || 0}</strong> results (Source:{' '}
            <span className="text-royal font-bold">{searchResults.source}</span>)
          </span>
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {searchResults?.items?.map((item: any) => (
          <motion.div
            key={item.programId}
            whileHover={{ y: -4 }}
            className="glass-panel p-6 rounded-3xl border border-slate-200 hover:border-royal transition-all flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-blue-50 text-royal border border-blue-200">
                  {item.countryName || item.countryIsoCode}
                </span>
                <span className="text-[11px] text-slate-500 font-mono font-semibold">{item.degreeLevel || 'MS'}</span>
              </div>

              <h3 className="text-lg font-bold font-outfit text-slate-navy mb-1">{item.title}</h3>
              <p className="text-xs text-royal font-semibold mb-4">{item.universityName}</p>

              <div className="space-y-1.5 text-xs text-slate-600 mb-6 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 font-mono">
                <div className="flex justify-between">
                  <span>Field:</span>
                  <span className="text-slate-900 font-bold">{item.fieldOfStudy}</span>
                </div>
                <div className="flex justify-between">
                  <span>Min GPA Req:</span>
                  <span className="text-royal font-extrabold">{item.minGpa ? `${item.minGpa} / 4.0` : 'N/A'}</span>
                </div>
                {item.minIelts && (
                  <div className="flex justify-between">
                    <span>Min IELTS:</span>
                    <span className="text-slate-800 font-bold">{item.minIelts}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 flex items-center gap-1 font-mono font-medium">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                {item.scholarshipRulesCount || 1} Rule(s) Active
              </span>
              <a
                href={`/match?field=${encodeURIComponent(item.fieldOfStudy)}`}
                className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-royal hover:text-white text-royal text-xs font-bold transition-all shadow-sm"
              >
                Match Fit →
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
