'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Sparkles, Search, Layers, Columns3, Menu, X, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home', icon: Compass },
    { href: '/match', label: 'Match Fit Engine', icon: Sparkles },
    { href: '/search', label: 'Explore Programs', icon: Search },
    { href: '/taxonomy', label: 'UN Geography', icon: Layers },
    { href: '/comparison', label: 'Country Matrix', icon: Columns3 },
  ];

  return (
    <header className="sticky top-0 z-50 px-4 sm:px-8 py-3.5 backdrop-blur-xl bg-white/80 border-b border-slate-200/80 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-royal to-sky-glow p-[1px] shadow-[0_0_20px_rgba(37,99,235,0.25)] group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-royal" />
            </div>
          </div>
          <div>
            <span className="text-lg font-extrabold font-outfit tracking-tight text-slate-navy flex items-center gap-1.5">
              SCHOLAR<span className="gradient-text-royal">MATCH</span>
            </span>
            <span className="block text-[10px] text-slate-500 tracking-wider font-mono uppercase font-semibold">Global Masters Engine</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-full border border-slate-200 shadow-inner">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${
                  isActive ? 'text-white' : 'text-slate-600 hover:text-royal'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-royal rounded-full shadow-md shadow-blue-500/20"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* CTA Button */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/match"
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-royal to-sky-glow text-white font-bold text-xs tracking-wide shadow-[0_4px_20px_rgba(37,99,235,0.35)] hover:shadow-[0_6px_25px_rgba(37,99,235,0.5)] hover:scale-105 transition-all"
          >
            <Sparkles className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
            <span>Evaluate My Fit</span>
          </Link>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-royal"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-royal" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 overflow-hidden rounded-2xl glass-panel p-4 border border-slate-200 shadow-xl"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                      isActive ? 'bg-blue-50 text-royal border border-blue-200' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-royal" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              <Link
                href="/match"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-royal text-white font-bold text-sm shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>Evaluate My Fit</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
