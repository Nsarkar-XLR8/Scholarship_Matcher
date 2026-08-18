'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Search, ShieldCheck, ArrowRight, Compass, GraduationCap, Globe, CheckCircle2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const [quickGpa, setQuickGpa] = useState<string>('3.5');
  const [quickField, setQuickField] = useState<string>('Computer Science');

  useEffect(() => {
    if (headlineRef.current) {
      gsap.fromTo(
        headlineRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }
      );
    }

    const cards = document.querySelectorAll('.animate-card');
    cards.forEach((card, index) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: index * 0.15,
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
          },
        }
      );
    });
  }, []);

  return (
    <div className="relative overflow-hidden pt-8 pb-20">
      {/* Background Ambient Radial Lights */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-radial-royal pointer-events-none blur-3xl opacity-75 animate-pulse-glow" />
      <div className="absolute top-96 right-10 w-[500px] h-[400px] bg-radial-sky pointer-events-none blur-3xl opacity-50" />

      {/* Hero Section */}
      <section ref={heroRef} className="max-w-7xl mx-auto px-4 sm:px-8 pt-12 pb-16 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-blue-200 text-royal text-xs font-semibold mb-8 shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-royal animate-spin" style={{ animationDuration: '6s' }} />
          <span>Zero Magic Feeds • 100% Data Honest Matcher</span>
        </motion.div>

        <h1 ref={headlineRef} className="text-4xl sm:text-6xl md:text-7xl font-extrabold font-outfit tracking-tight leading-[1.1] max-w-5xl mx-auto mb-6 text-slate-navy">
          Real Master’s Funding.{' '}
          <span className="gradient-text-royal block sm:inline">No Formulaic Myths.</span>
        </h1>

        <p className="text-slate-600 text-base sm:text-xl max-w-3xl mx-auto font-normal leading-relaxed mb-10">
          Match your GPA, IELTS, GRE & papers against published university merit waivers, UN M49 geographic scholarship scopes, and real crowdsourced student admit yields.
        </p>

        {/* Quick Match Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-3xl mx-auto glass-panel p-3 sm:p-4 rounded-3xl border border-slate-200 shadow-2xl flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <GraduationCap className="w-5 h-5 text-royal shrink-0" />
            <div className="text-left w-full">
              <label className="block text-[10px] text-slate-500 font-mono uppercase font-bold tracking-wider">Your GPA (4.0 Scale)</label>
              <input
                type="number"
                step="0.05"
                min="1.0"
                max="4.0"
                value={quickGpa}
                onChange={(e) => setQuickGpa(e.target.value)}
                className="w-full bg-transparent text-slate-navy font-bold text-sm focus:outline-none"
                placeholder="e.g. 3.5"
              />
            </div>
          </div>

          <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <Compass className="w-5 h-5 text-sky-glow shrink-0" />
            <div className="text-left w-full">
              <label className="block text-[10px] text-slate-500 font-mono uppercase font-bold tracking-wider">Target Field</label>
              <input
                type="text"
                value={quickField}
                onChange={(e) => setQuickField(e.target.value)}
                className="w-full bg-transparent text-slate-navy font-bold text-sm focus:outline-none"
                placeholder="Computer Science, Data..."
              />
            </div>
          </div>

          <Link
            href={`/match?gpa=${quickGpa}&field=${encodeURIComponent(quickField)}`}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-royal to-sky-glow text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-500/25 hover:scale-105 transition-transform flex items-center justify-center gap-2 shrink-0"
          >
            <span>Match Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Live Ticker Metrics */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { label: 'Verified Formula Rules', value: '100% Published', color: 'text-royal' },
            { label: 'UN Countries Tracked', value: 'Germany, UK, US...', color: 'text-sky-glow' },
            { label: 'Requirement Ledger', value: 'Event Sourced', color: 'text-amber-gold' },
            { label: 'Outcome Moderation', value: 'IQR / Z-Score Filter', color: 'text-slate-700' },
          ].map((stat, i) => (
            <div key={i} className="glass-panel p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
              <span className={`block text-lg sm:text-xl font-bold font-outfit ${stat.color}`}>{stat.value}</span>
              <span className="text-[11px] text-slate-500 font-mono font-semibold uppercase">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Main Feature Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold font-outfit text-slate-navy">How ScholarMatch Solves the Data Reality</h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto mt-2 font-normal">
            Built from day one to handle real-world university funding: explicit confidence tiers, multi-campus structures, and zero fake guarantees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="animate-card glass-panel p-8 rounded-3xl glass-card-hover border border-slate-200 relative overflow-hidden group">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-6">
              <ShieldCheck className="w-7 h-7 text-royal" />
            </div>
            <h3 className="text-xl font-bold font-outfit text-slate-navy mb-3">Explicit Confidence Tiers</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Every scholarship carries a clear label: <strong className="text-royal font-semibold">Official Published Rule</strong> (for tiered merit waivers in Germany, Malaysia, etc.) vs <strong className="text-sky-glow font-semibold">Crowdsourced Distribution</strong> from self-reported student admits.
            </p>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-royal font-mono font-bold">
              <span>Confidence Labeling</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="animate-card glass-panel p-8 rounded-3xl glass-card-hover border border-slate-200 relative overflow-hidden group">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mb-6">
              <Globe className="w-7 h-7 text-sky-glow" />
            </div>
            <h3 className="text-xl font-bold font-outfit text-slate-navy mb-3">Multi-Scoped Funding Rules</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Scholarships attach at different levels: Program-specific research assistantships, University-wide Dean’s waivers, and Country-wide government grants (DAAD, Chevening).
            </p>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-sky-glow font-mono font-bold">
              <span>Hierarchical Joins</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="animate-card glass-panel p-8 rounded-3xl glass-card-hover border border-slate-200 relative overflow-hidden group">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-6">
              <TrendingUp className="w-7 h-7 text-amber-gold" />
            </div>
            <h3 className="text-xl font-bold font-outfit text-slate-navy mb-3">Event-Sourced Ledger Audit</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Requirements change over time. Every program requirement is versioned with <code className="text-amber-800 font-mono text-[11px] bg-amber-50 px-1 py-0.5 rounded">validFrom</code> and <code className="text-amber-800 font-mono text-[11px] bg-amber-50 px-1 py-0.5 rounded">validTo</code> windows so you never see stale data.
            </p>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-amber-gold font-mono font-bold">
              <span>2-Stage Change Detection</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 py-12">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-blue-200 text-center relative overflow-hidden bg-gradient-to-b from-white to-blue-50/50 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-2xl sm:text-4xl font-extrabold font-outfit text-slate-navy mb-4">
            Ready to Find Your Real Master’s Scholarship Match?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto mb-8 font-normal">
            No signup needed. Input your GPA, IELTS, GRE, and target country to evaluate your qualification status instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/match"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-royal text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform"
            >
              Start Eligibility Match
            </Link>
            <Link
              href="/search"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white border border-slate-200 text-slate-800 font-semibold text-sm hover:bg-slate-50 transition-colors shadow-sm"
            >
              Browse OpenSearch Catalog
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
