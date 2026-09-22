'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ShortlistedProgram {
  programId: string;
  programTitle: string;
  fieldOfStudy?: string;
  universityName: string;
  domain: string;
  countryName: string;
  countryIsoCode: string;
  campusName?: string;
  tuitionFeeLocal: number;
  currencyCode: string;
  qualificationStatus: 'QUALIFIED' | 'REACH' | 'SAFETY';
  matchFitScorePct: number;
  requirements: {
    minGpa: number;
    minIelts: number | null;
    minToefl: number | null;
    minGre: number | null;
    workExpYearsRequired?: number;
    requiresPapers?: boolean;
  };
  scholarshipOffer?: {
    publishedRules: Array<{
      title: string;
      scope: string;
      type: string;
      calculatedPct: number;
      description?: string | null;
      officialSourceUrl?: string | null;
    }>;
    crowdsourcedDistribution?: {
      medianScholarshipPct: number;
      p75ScholarshipPct: number;
    } | null;
  };
  officialSourceUrl?: string | null;
  applicationDeadline?: Date | string | null;
  milestones?: {
    languageTestBy: string;
    documentLegalizationBy: string;
    portalSubmissionWindow: string;
    expectedDecisionDate: string;
    visaAppointmentBy: string;
  };
}

interface ShortlistContextType {
  shortlist: ShortlistedProgram[];
  toggleShortlist: (program: ShortlistedProgram) => void;
  isShortlisted: (programId: string) => boolean;
  removeFromShortlist: (programId: string) => void;
  clearShortlist: () => void;
  isComparisonOpen: boolean;
  setIsComparisonOpen: (open: boolean) => void;
}

const ShortlistContext = createContext<ShortlistContextType | undefined>(undefined);

const STORAGE_KEY = 'scholar_match_shortlist_v1';

export function ShortlistProvider({ children }: { children: React.ReactNode }) {
  const [shortlist, setShortlist] = useState<ShortlistedProgram[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setShortlist(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load shortlist from localStorage', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shortlist));
    } catch (e) {
      console.error('Failed to save shortlist to localStorage', e);
    }
  }, [shortlist, isInitialized]);

  const toggleShortlist = (program: ShortlistedProgram) => {
    setShortlist((prev) => {
      const exists = prev.some((p) => p.programId === program.programId);
      if (exists) {
        return prev.filter((p) => p.programId !== program.programId);
      }
      if (prev.length >= 4) {
        alert('You can shortlist up to 4 programs for side-by-side comparison.');
        return prev;
      }
      return [...prev, program];
    });
  };

  const isShortlisted = (programId: string) => {
    return shortlist.some((p) => p.programId === programId);
  };

  const removeFromShortlist = (programId: string) => {
    setShortlist((prev) => prev.filter((p) => p.programId !== programId));
  };

  const clearShortlist = () => {
    setShortlist([]);
  };

  return (
    <ShortlistContext.Provider
      value={{
        shortlist,
        toggleShortlist,
        isShortlisted,
        removeFromShortlist,
        clearShortlist,
        isComparisonOpen,
        setIsComparisonOpen,
      }}
    >
      {children}
    </ShortlistContext.Provider>
  );
}

export function useShortlist() {
  const context = useContext(ShortlistContext);
  if (!context) {
    throw new Error('useShortlist must be used within a ShortlistProvider');
  }
  return context;
}
