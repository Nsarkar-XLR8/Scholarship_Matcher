'use client';

import React, { useEffect, useState } from 'react';
import { Layers, Globe, ShieldCheck, ArrowRight, Building2, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchTaxonomyTree } from '@/lib/api-client';

export default function TaxonomyPage() {
  const [treeData, setTreeData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedContinent, setSelectedContinent] = useState<string>('EU');

  useEffect(() => {
    fetchTaxonomyTree()
      .then((data) => {
        setTreeData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load taxonomy tree:', err);
        setIsLoading(false);
      });
  }, []);

  const activeContinent = treeData.find((c) => c.code === selectedContinent) || treeData[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-royal text-xs font-mono mb-4 shadow-sm">
          <Globe className="w-3.5 h-3.5 text-royal" />
          UN M49 Geographic Standard Taxonomy
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-outfit text-slate-navy mb-3">
          Global Geographic Catalog
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Browse countries by UN M49 continent and region, check university coverage counts, and inspect data completeness percentages.
        </p>
      </div>

      {/* Continent Tabs */}
      <div className="flex justify-center gap-2 mb-10 overflow-x-auto pb-2">
        {treeData.map((continent) => (
          <button
            key={continent.id}
            onClick={() => setSelectedContinent(continent.code)}
            className={`px-6 py-3 rounded-2xl text-xs font-bold font-outfit tracking-wide transition-all whitespace-nowrap ${
              selectedContinent === continent.code
                ? 'bg-gradient-to-r from-blue-600 to-royal text-white shadow-md shadow-blue-500/20 scale-105'
                : 'glass-panel border-slate-200 text-slate-700 hover:text-royal'
            }`}
          >
            {continent.name} (UN M49: {continent.unM49Code})
          </button>
        ))}
      </div>

      {/* Region & Country Cards Grid */}
      {activeContinent && (
        <div className="space-y-8">
          {activeContinent.regions.map((region: any) => (
            <div key={region.id} className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl">
              <h3 className="text-xl font-bold font-outfit text-slate-navy mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Layers className="w-5 h-5 text-royal" />
                {region.name} Region
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {region.countries.map((country: any) => (
                  <motion.div
                    key={country.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-royal transition-all space-y-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold font-outfit text-slate-navy">{country.name}</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 text-royal border border-blue-200">
                        ISO: {country.isoCode}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 font-mono">
                      <div className="flex justify-between">
                        <span>Universities Tracked:</span>
                        <span className="text-slate-900 font-bold">{country._count?.universities || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Native Currency:</span>
                        <span className="text-royal font-bold">{country.currencyCode}</span>
                      </div>
                    </div>

                    {/* Data Completeness Bar */}
                    <div className="pt-2">
                      <div className="flex justify-between text-[10px] font-mono mb-1">
                        <span className="text-slate-500 font-bold">Data Completeness Bar</span>
                        <span className="text-royal font-extrabold">{country.dataCompletenessPct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-royal h-full rounded-full"
                          style={{ width: `${country.dataCompletenessPct}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
