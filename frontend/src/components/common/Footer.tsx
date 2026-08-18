'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, ShieldCheck, Activity } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function Footer() {
  const [apiStatus, setApiStatus] = useState<'UP' | 'DOWN' | 'CHECKING'>('CHECKING');

  useEffect(() => {
    apiClient
      .get('/health')
      .then((res) => {
        if (res.data?.status === 'UP') setApiStatus('UP');
        else setApiStatus('DOWN');
      })
      .catch(() => setApiStatus('DOWN'));
  }, []);

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 py-12 px-4 sm:px-8 mt-20 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 relative z-10">
        {/* Col 1: Brand */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-royal p-[1px]">
              <div className="w-full h-full bg-white rounded-[7px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-royal" />
              </div>
            </div>
            <span className="text-xl font-extrabold font-outfit text-slate-navy">
              SCHOLAR<span className="gradient-text-royal">MATCH</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-md leading-relaxed">
            The data-honest global master’s scholarship matcher. Built with NestJS, OpenSearch, PostgreSQL, and Lenis/GSAP. Combining official published formulas, UN M49 geography, and crowdsourced student distributions.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
              <span className={`w-2 h-2 rounded-full ${apiStatus === 'UP' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              Backend: {apiStatus === 'UP' ? 'NestJS Operational' : 'Degraded Mode'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium text-royal">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Data Honest Protocol
            </span>
          </div>
        </div>

        {/* Col 2: Navigation */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold font-outfit text-slate-navy tracking-wider uppercase">Platform</h4>
          <ul className="space-y-2 text-xs font-medium">
            <li><Link href="/match" className="hover:text-royal transition-colors">Match Fit Engine</Link></li>
            <li><Link href="/search" className="hover:text-royal transition-colors">Explore Programs</Link></li>
            <li><Link href="/taxonomy" className="hover:text-royal transition-colors">UN M49 Geography</Link></li>
            <li><Link href="/comparison" className="hover:text-royal transition-colors">Country Cost Matrix</Link></li>
          </ul>
        </div>

        {/* Col 3: Principles */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold font-outfit text-slate-navy tracking-wider uppercase">Data Philosophy</h4>
          <p className="text-xs text-slate-500 leading-relaxed font-normal">
            No magic feeds or fake 100% promises. Every scholarship figure displays its source confidence (`VERIFIED` official formula vs `CROWDSOURCED` distribution).
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Global Masters Scholarship Matcher. Built for prospective students worldwide.</p>
        <p className="font-mono text-[11px] mt-2 sm:mt-0 text-slate-400">NestJS 10 • Next.js 16 • OpenSearch 2.11 • PostgreSQL 16</p>
      </div>
    </footer>
  );
}
