'use client';

import React from 'react';
import { ShieldCheck, Info, Users } from 'lucide-react';

interface ConfidenceBadgeProps {
  confidence: 'VERIFIED' | 'SCRAPED_UNVERIFIED' | 'CROWDSOURCED' | string;
  size?: 'sm' | 'md';
}

export default function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  if (confidence === 'VERIFIED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold tracking-wide shadow-sm">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        Official Published Rule
      </span>
    );
  }

  if (confidence === 'CROWDSOURCED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-royal-soft border border-blue-200 text-royal-deep text-xs font-semibold tracking-wide shadow-sm">
        <Users className="w-3.5 h-3.5 text-royal" />
        Crowdsourced Student Distribution
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold tracking-wide shadow-sm">
      <Info className="w-3.5 h-3.5 text-amber-600" />
      Unverified Formula (Scraped)
    </span>
  );
}
