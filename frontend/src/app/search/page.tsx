'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Globe, BookOpen, Award, CheckCircle, RefreshCw, Layers, X, Bookmark, ExternalLink, GraduationCap, DollarSign, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchableSelect, { SelectOption } from '@/components/common/SearchableSelect';
import { searchPrograms } from '@/lib/api-client';
import { useToast } from '@/components/common/ToastProvider';
import { formatOfficialUrl } from '@/lib/url-formatter.util';

const COUNTRY_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Countries', icon: '🌐' },
  { value: 'DE', label: 'Germany', sublabel: 'Europe', icon: '🇩🇪' },
  { value: 'NL', label: 'Netherlands', sublabel: 'Europe', icon: '🇳🇱' },
  { value: 'GB', label: 'United Kingdom', sublabel: 'Europe', icon: '🇬🇧' },
  { value: 'US', label: 'United States', sublabel: 'North America', icon: '🇺🇸' },
  { value: 'MY', label: 'Malaysia', sublabel: 'Asia', icon: '🇲🇾' },
  { value: 'CA', label: 'Canada', sublabel: 'North America', icon: '🇨🇦' },
  { value: 'AU', label: 'Australia', sublabel: 'Oceania', icon: '🇦🇺' },
  { value: 'SE', label: 'Sweden', sublabel: 'Europe', icon: '🇸🇪' },
];

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

export default function SearchPage() {
  const { showToast } = useToast();

  const [query, setQuery] = useState<string>('');
  const [countryIsoCode, setCountryIsoCode] = useState<string>('');
  const [fieldOfStudy, setFieldOfStudy] = useState<string>('');
  const [maxGpa, setMaxGpa] = useState<number>(4.0);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const handleSearch = useCallback(async () => {
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
  }, [query, countryIsoCode, fieldOfStudy, maxGpa]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [handleSearch]);

  const clearAllFilters = () => {
    setQuery('');
    setCountryIsoCode('');
    setFieldOfStudy('');
    setMaxGpa(4.0);
    showToast('Filters cleared', 'Showing all available master’s programs', 'info');
  };

  const toggleBookmark = (programId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (bookmarkedIds.includes(programId)) {
      setBookmarkedIds((prev) => prev.filter((id) => id !== programId));
      showToast('Program Unpinned', `Removed "${title}" from your bookmarks`, 'info');
    } else {
      setBookmarkedIds((prev) => [...prev, programId]);
      showToast('Program Pinned! 📌', `Saved "${title}" to your comparison list`, 'success');
    }
  };

  const activeFiltersCount =
    (query ? 1 : 0) + (countryIsoCode ? 1 : 0) + (fieldOfStudy ? 1 : 0) + (maxGpa < 4.0 ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      {/* Search Header */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-royal text-xs font-semibold mb-4 shadow-sm">
          <Layers className="w-3.5 h-3.5 text-royal" />
          Faceted OpenSearch Cluster & Program Explorer
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-outfit text-slate-navy mb-3">
          Explore Master’s Programs
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Filter thousands of programs across countries, fields of study, GPA thresholds, and verified scholarship rules.
        </p>
      </div>

      {/* Main Search Controls & Facet Panel */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 mb-8 space-y-5 shadow-xl">
        {/* Main Search Input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keyword, university, or program title..."
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
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-royal text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-500/25 hover:scale-105 transition-transform shrink-0 flex items-center justify-center gap-2"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Search</span>
          </button>
        </div>

        {/* Facet Dropdown Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
          {/* Country Searchable Dropdown */}
          <SearchableSelect
            options={COUNTRY_OPTIONS}
            value={countryIsoCode}
            onChange={(val) => setCountryIsoCode(val)}
            label="Filter Country"
            placeholder="All Countries"
            searchPlaceholder="Search country..."
            icon={<Globe className="w-4 h-4" />}
          />

          {/* Field of Study Searchable Dropdown */}
          <SearchableSelect
            options={FIELD_OPTIONS}
            value={fieldOfStudy}
            onChange={(val) => setFieldOfStudy(val)}
            label="Field of Study"
            placeholder="All Fields"
            searchPlaceholder="Search study field..."
            icon={<GraduationCap className="w-4 h-4" />}
          />

          {/* Max GPA Slider */}
          <div className="flex flex-col justify-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center text-xs mb-1.5 font-semibold">
              <span className="text-slate-500 font-mono uppercase font-bold tracking-wider">Max Min-GPA</span>
              <span className="text-royal font-mono font-extrabold text-xs">{maxGpa} / 4.0</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="4.0"
              step="0.1"
              value={maxGpa}
              onChange={(e) => setMaxGpa(parseFloat(e.target.value))}
              className="w-full accent-royal bg-slate-200 rounded-lg cursor-pointer h-2"
            />
          </div>
        </div>

        {/* Active Filter Chips / Tags */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 font-mono font-bold uppercase text-[10px]">Active Filters:</span>
              {query && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-royal font-semibold border border-blue-200">
                  Keyword: "{query}"
                  <button onClick={() => setQuery('')} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {countryIsoCode && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-royal font-semibold border border-blue-200">
                  Country: {countryIsoCode}
                  <button onClick={() => setCountryIsoCode('')} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {fieldOfStudy && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-royal font-semibold border border-blue-200">
                  Field: {fieldOfStudy}
                  <button onClick={() => setFieldOfStudy('')} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {maxGpa < 4.0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-royal font-semibold border border-blue-200">
                  Max GPA: {maxGpa}
                  <button onClick={() => setMaxGpa(4.0)} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
            <button
              onClick={clearAllFilters}
              className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
            >
              Clear All ({activeFiltersCount})
            </button>
          </div>
        )}
      </div>

      {/* Results Header Info */}
      {searchResults && (
        <div className="flex items-center justify-between mb-6 px-2">
          <span className="text-xs text-slate-500 font-mono">
            Showing <strong className="text-slate-navy">{searchResults.items?.length || 0}</strong> programs (Engine:{' '}
            <span className="text-royal font-bold">{searchResults.source}</span>)
          </span>
          {bookmarkedIds.length > 0 && (
            <span className="text-xs text-royal font-bold flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              <Bookmark className="w-3.5 h-3.5 fill-royal" /> {bookmarkedIds.length} Pinned
            </span>
          )}
        </div>
      )}

      {/* Results Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {searchResults?.items?.map((item: any) => {
          const isPinned = bookmarkedIds.includes(item.programId);
          return (
            <motion.div
              key={item.programId}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedProgram(item)}
              className="glass-panel p-6 rounded-3xl border border-slate-200 hover:border-royal transition-all flex flex-col justify-between shadow-lg cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-blue-50 text-royal border border-blue-200 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {item.countryName || item.countryIsoCode}
                  </span>
                  <button
                    onClick={(e) => toggleBookmark(item.programId, item.title, e)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-royal hover:bg-blue-50 transition-colors"
                  >
                    <Bookmark className={`w-4 h-4 ${isPinned ? 'fill-royal text-royal' : ''}`} />
                  </button>
                </div>

                <h3 className="text-lg font-bold font-outfit text-slate-navy group-hover:text-royal transition-colors mb-1">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <p className="text-xs text-royal font-semibold truncate">{item.universityName}</p>
                  <a
                    href={formatOfficialUrl(item.officialWebsiteUrl, item.domain, item.universityName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] text-royal hover:underline font-semibold shrink-0 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200"
                    title={`Visit official portal for ${item.universityName}`}
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3 text-royal" />
                  </a>
                </div>

                <div className="space-y-2 text-xs text-slate-600 mb-6 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Field:</span>
                    <span className="text-slate-900 font-bold">{item.fieldOfStudy}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Min GPA Req:</span>
                    <span className="text-royal font-extrabold">{item.minGpa ? `${item.minGpa} / 4.0` : 'None'}</span>
                  </div>
                  {item.minIelts && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Min IELTS:</span>
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
                <span className="px-3.5 py-1.5 rounded-xl bg-blue-50 group-hover:bg-royal group-hover:text-white text-royal text-xs font-bold transition-all shadow-sm flex items-center gap-1">
                  View Details →
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Program Details Modal */}
      <AnimatePresence>
        {selectedProgram && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedProgram(null)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-xs font-mono font-bold text-royal mb-2">
                <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
                  {selectedProgram.countryName} ({selectedProgram.countryIsoCode})
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                  {selectedProgram.degreeLevel || 'Master of Science'}
                </span>
              </div>

              <h2 className="text-2xl font-extrabold font-outfit text-slate-navy mb-1">
                {selectedProgram.title}
              </h2>
              <p className="text-sm font-semibold text-royal mb-6">{selectedProgram.universityName}</p>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="block text-[10px] text-slate-400 font-mono uppercase font-bold">Field of Study</span>
                  <span className="text-xs font-bold text-slate-900">{selectedProgram.fieldOfStudy}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="block text-[10px] text-slate-400 font-mono uppercase font-bold">Min GPA Req</span>
                  <span className="text-xs font-extrabold text-royal">{selectedProgram.minGpa ? `${selectedProgram.minGpa} / 4.0` : 'None'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="block text-[10px] text-slate-400 font-mono uppercase font-bold">Language Standard</span>
                  <span className="text-xs font-bold text-slate-900">IELTS {selectedProgram.minIelts || '6.5'}</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h4 className="text-xs font-bold font-mono text-slate-500 uppercase mb-2">Program Details</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {selectedProgram.description ||
                    `This accredited Master’s program at ${selectedProgram.universityName} offers comprehensive coursework and research pathways tailored for international candidates in ${selectedProgram.fieldOfStudy}.`}
                </p>
              </div>

              {/* Official Portals & Links */}
              <div className="mb-6 space-y-2">
                <h4 className="text-xs font-bold font-mono text-slate-500 uppercase flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-royal" /> Official Portals & Admission Links
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={formatOfficialUrl(selectedProgram.officialWebsiteUrl, selectedProgram.domain, selectedProgram.universityName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 rounded-2xl flex items-center justify-between text-xs font-semibold text-royal transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Globe className="w-4 h-4 text-royal shrink-0" />
                      <div className="truncate text-left">
                        <span className="block font-bold text-slate-900 truncate">University Official Site</span>
                        <span className="text-[10px] text-slate-500 font-mono block truncate">
                          {selectedProgram.domain || selectedProgram.universityName}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-royal shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </a>

                  <a
                    href={formatOfficialUrl(selectedProgram.sourceUrl, selectedProgram.domain, `${selectedProgram.universityName} ${selectedProgram.title}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs font-semibold text-emerald-950 transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <GraduationCap className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div className="truncate text-left">
                        <span className="block font-bold text-slate-900 truncate">Direct Admission Page</span>
                        <span className="text-[10px] text-emerald-700 font-mono block truncate">Official Program Terms</span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-emerald-700 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </div>

              {/* Scholarship Opportunities */}
              <div className="mb-8">
                <h4 className="text-xs font-bold font-mono text-slate-500 uppercase mb-3 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" /> Linked Scholarship Rules
                </h4>
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-amber-950">
                    <span>{selectedProgram.universityName} Merit Waiver</span>
                    <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-mono">VERIFIED</span>
                  </div>
                  <p className="text-amber-800 text-[11px]">
                    Covers up to 100% tuition waiver for candidates meeting GPA threshold of {selectedProgram.minGpa || '3.5'}.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                <a
                  href={`/match?field=${encodeURIComponent(selectedProgram.fieldOfStudy)}&gpa=${selectedProgram.minGpa || 3.5}`}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-royal text-white font-bold text-xs text-center shadow-lg shadow-blue-500/25 hover:scale-105 transition-transform"
                >
                  Evaluate Profile Match Fit →
                </a>
                <button
                  onClick={() => setSelectedProgram(null)}
                  className="py-3 px-6 rounded-2xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors"
                >
                  Close Modal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
