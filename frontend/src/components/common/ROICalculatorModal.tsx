'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, DollarSign, Clock, ShieldCheck, Award, Briefcase, ChevronRight, HelpCircle, CheckCircle2, ArrowRight, Landmark, CreditCard, Percent, AlertCircle } from 'lucide-react';

interface ROICalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: {
    programTitle: string;
    universityName: string;
    countryName: string;
    currencyCode: string;
    tuitionFeeLocal: number;
    durationMonths?: number;
    scholarshipOffer?: {
      publishedRules: Array<{ calculatedPct: number }>;
      crowdsourcedDistribution?: { medianScholarshipPct: number } | null;
    };
  };
}

export default function ROICalculatorModal({ isOpen, onClose, program }: ROICalculatorModalProps) {
  // Active Tab: 'roi' | 'loan'
  const [activeTab, setActiveTab] = useState<'roi' | 'loan'>('roi');

  // Duration in months
  const durationMonths = program.durationMonths || 24;

  // Default scholarship percentage detected
  const defaultScholarship = program.scholarshipOffer?.publishedRules?.[0]?.calculatedPct ||
    program.scholarshipOffer?.crowdsourcedDistribution?.medianScholarshipPct || 0;

  // State sliders for ROI
  const [currentAnnualSalary, setCurrentAnnualSalary] = useState<number>(35000);
  const [scholarshipPct, setScholarshipPct] = useState<number>(defaultScholarship);
  const [monthlyLivingCost, setMonthlyLivingCost] = useState<number>(1200);
  const [expectedPostGradSalary, setExpectedPostGradSalary] = useState<number>(75000);
  const [workHoursPerWeek, setWorkHoursPerWeek] = useState<number>(20);
  const [hourlyWage, setHourlyWage] = useState<number>(14);

  // Mathematical Calculations for ROI
  const grossTuition = program.tuitionFeeLocal || 20000;
  const scholarshipDiscount = grossTuition * (scholarshipPct / 100);
  const netTuition = Math.max(0, grossTuition - scholarshipDiscount);
  const totalLivingCost = monthlyLivingCost * durationMonths;
  
  // Total direct out-of-pocket study cost
  const directStudyCost = netTuition + totalLivingCost;

  // State sliders for No-Cosigner Loan Estimator (MPOWER/Prodigy)
  const defaultLoanAmount = Math.min(100000, Math.round(directStudyCost));
  const [loanPrincipal, setLoanPrincipal] = useState<number>(defaultLoanAmount);
  const [loanInterestRate, setLoanInterestRate] = useState<number>(12.99); // 12.99% standard international APR
  const [loanTermYears, setLoanTermYears] = useState<number>(10); // 10 years standard
  const [gracePeriodMonths, setGracePeriodMonths] = useState<number>(6); // 6 months post grad

  if (!isOpen) return null;

  // Opportunity Cost: Lost earnings while studying
  const monthlySalary = currentAnnualSalary / 12;
  const lostGrossIncome = monthlySalary * durationMonths;

  // Part-time in-study student earnings
  const monthlyInStudyEarnings = workHoursPerWeek * hourlyWage * 4.2;
  const totalInStudyEarnings = monthlyInStudyEarnings * durationMonths * 0.8;

  // Net Total Capital Investment
  const netTotalInvestment = Math.max(0, directStudyCost + (lostGrossIncome * 0.5) - totalInStudyEarnings);

  // Post-Grad Annual Net Increment
  const annualSalaryJump = Math.max(0, expectedPostGradSalary - currentAnnualSalary);
  const annualPostGradRecoupCapacity = Math.max(8000, annualSalaryJump * 0.7 + (expectedPostGradSalary * 0.25));

  // Payback Period
  const paybackMonths = Math.max(4, Math.round((netTotalInvestment / annualPostGradRecoupCapacity) * 12));
  const paybackYears = (paybackMonths / 12).toFixed(1);

  // 5-Year Net Wealth Gain
  const fiveYearGrossIncrement = annualSalaryJump * 5;
  const fiveYearNetGain = Math.round(fiveYearGrossIncrement - netTotalInvestment);

  // Loan Calculations (Standard Amortization: M = P * [r(1+r)^n] / [(1+r)^n - 1])
  const monthlyRate = (loanInterestRate / 100) / 12;
  const totalPaymentsCount = loanTermYears * 12;
  const monthlyLoanPayment = monthlyRate > 0
    ? (loanPrincipal * (monthlyRate * Math.pow(1 + monthlyRate, totalPaymentsCount))) / (Math.pow(1 + monthlyRate, totalPaymentsCount) - 1)
    : loanPrincipal / totalPaymentsCount;
  
  const totalLoanRepaid = monthlyLoanPayment * totalPaymentsCount;
  const totalInterestPaid = Math.max(0, totalLoanRepaid - loanPrincipal);
  const monthlyPostGradSalaryGross = expectedPostGradSalary / 12;
  const debtToIncomeRatio = monthlyPostGradSalaryGross > 0
    ? Math.round((monthlyLoanPayment / monthlyPostGradSalaryGross) * 100)
    : 0;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-md overflow-y-auto"
        data-lenis-prevent="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          data-lenis-prevent="true"
          onClick={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header Banner - Fixed at Top */}
          <div className="bg-gradient-to-r from-slate-900 via-royal to-blue-800 text-white p-5 sm:p-7 shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-white/90 text-xs font-mono font-semibold mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
                  Financial Decision Modeling & Proof-of-Funds Intelligence
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold font-outfit">
                  {activeTab === 'roi' ? 'Master’s Investment & Payback Analysis' : 'No-Cosigner International Student Loan Estimator'}
                </h2>
                <p className="text-white/80 text-xs mt-0.5">
                  {program.programTitle} — <span className="text-white font-semibold">{program.universityName}</span> ({program.countryName})
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('roi')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold font-outfit transition-all flex items-center gap-1.5 ${
                  activeTab === 'roi'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-royal" />
                <span>Career ROI & Salary Jump</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('loan')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold font-outfit transition-all flex items-center gap-1.5 ${
                  activeTab === 'loan'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <Landmark className="w-3.5 h-3.5 text-emerald-600" />
                <span>No-Cosigner Loan (MPOWER / Prodigy)</span>
              </button>
            </div>

            {/* Quick KPI Ribbon */}
            {activeTab === 'roi' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-white/10">
                <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-sm">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-white/70 block">Payback Time</span>
                  <span className="text-lg sm:text-xl font-black text-amber-300 font-outfit">{paybackMonths} Months</span>
                  <span className="text-[10px] text-white/75 block">({paybackYears} Years)</span>
                </div>
                <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-sm">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-white/70 block">5-Yr Net ROI</span>
                  <span className="text-lg sm:text-xl font-black text-emerald-300 font-outfit">+${fiveYearNetGain.toLocaleString()}</span>
                  <span className="text-[10px] text-white/75 block">Net Lifetime Increment</span>
                </div>
                <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-sm">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-white/70 block">Net Degree Cost</span>
                  <span className="text-lg sm:text-xl font-black text-white font-outfit">${Math.round(directStudyCost).toLocaleString()}</span>
                  <span className="text-[10px] text-white/75 block">Tuition + {durationMonths}mo Living</span>
                </div>
                <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-sm">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-white/70 block">Salary Jump</span>
                  <span className="text-lg sm:text-xl font-black text-cyan-300 font-outfit">+${annualSalaryJump.toLocaleString()}/yr</span>
                  <span className="text-[10px] text-white/75 block">Post-Grad vs Current</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-white/10">
                <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-sm">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-white/70 block">Monthly Repayment</span>
                  <span className="text-lg sm:text-xl font-black text-amber-300 font-outfit">${Math.round(monthlyLoanPayment)}/mo</span>
                  <span className="text-[10px] text-white/75 block">for {loanTermYears} Years (120 mo)</span>
                </div>
                <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-sm">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-white/70 block">Total Interest</span>
                  <span className="text-lg sm:text-xl font-black text-rose-300 font-outfit">${Math.round(totalInterestPaid).toLocaleString()}</span>
                  <span className="text-[10px] text-white/75 block">Over Full 10 Years</span>
                </div>
                <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-sm">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-white/70 block">Debt-to-Income</span>
                  <span className="text-lg sm:text-xl font-black text-emerald-300 font-outfit">{debtToIncomeRatio}%</span>
                  <span className="text-[10px] text-white/75 block">{debtToIncomeRatio < 20 ? 'Safe (<20%)' : 'Moderate'} of Starting Pay</span>
                </div>
                <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-sm">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-white/70 block">Loan Coverage</span>
                  <span className="text-lg sm:text-xl font-black text-cyan-300 font-outfit">${loanPrincipal.toLocaleString()}</span>
                  <span className="text-[10px] text-white/75 block">No Collateral / No Cosigner</span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Calculation Body */}
          <div 
            className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto flex-1 min-h-0 overscroll-contain"
            data-lenis-prevent="true"
          >
            {activeTab === 'roi' ? (
              <>
                {/* Left Inputs Section (Sliders) */}
                <div className="lg:col-span-6 space-y-5">
                  <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-royal" /> Current Professional Baseline
                  </h3>

                  {/* Current Annual Salary */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Current Annual Salary:</span>
                      <span className="font-mono font-bold text-royal text-sm">${currentAnnualSalary.toLocaleString()}/yr</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="150000"
                      step="5000"
                      value={currentAnnualSalary}
                      onChange={(e) => setCurrentAnnualSalary(Number(e.target.value))}
                      className="w-full accent-royal h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 block">Baseline earnings prior to commencing Master's</span>
                  </div>

                  {/* Scholarship Coverage % */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Scholarship / Aid Coverage:</span>
                      <span className="font-mono font-bold text-emerald-600 text-sm">{scholarshipPct}% (${Math.round(scholarshipDiscount).toLocaleString()})</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={scholarshipPct}
                      onChange={(e) => setScholarshipPct(Number(e.target.value))}
                      className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 block">Percentage of tuition offset by waivers or assistantships</span>
                  </div>

                  {/* Monthly Living Cost */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Estimated Monthly Living Cost:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">${monthlyLivingCost}/mo</span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="3000"
                      step="100"
                      value={monthlyLivingCost}
                      onChange={(e) => setMonthlyLivingCost(Number(e.target.value))}
                      className="w-full accent-royal h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Target Post-Grad Salary */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Expected Post-Graduation Salary:</span>
                      <span className="font-mono font-bold text-royal text-sm">${expectedPostGradSalary.toLocaleString()}/yr</span>
                    </div>
                    <input
                      type="range"
                      min="30000"
                      max="200000"
                      step="5000"
                      value={expectedPostGradSalary}
                      onChange={(e) => setExpectedPostGradSalary(Number(e.target.value))}
                      className="w-full accent-royal h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 block">Typical median starting salary for international graduates</span>
                  </div>

                  {/* In-Study Work Hours */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">In-Study Part-Time Work:</span>
                      <span className="font-mono font-bold text-slate-800 text-sm">{workHoursPerWeek} hrs/week @ ${hourlyWage}/hr</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="2"
                      value={workHoursPerWeek}
                      onChange={(e) => setWorkHoursPerWeek(Number(e.target.value))}
                      className="w-full accent-royal h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Right Financial Breakdown Section */}
                <div className="lg:col-span-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" /> Capital & Cashflow Breakdown
                  </h3>

                  {/* Cost Stack */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Gross Program Tuition ({durationMonths} mos):</span>
                      <span className="font-mono font-semibold">${grossTuition.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-600">
                      <span>Less Scholarship Funding ({scholarshipPct}%):</span>
                      <span className="font-mono font-semibold">-${Math.round(scholarshipDiscount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Net Out-of-Pocket Tuition:</span>
                      <span className="font-mono font-bold text-slate-900">${Math.round(netTuition).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Total Living & Housing ({durationMonths} mos):</span>
                      <span className="font-mono font-semibold">${totalLivingCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 text-amber-700">
                      <span>Net Opportunity Cost (Lost Base Salary Adj.):</span>
                      <span className="font-mono font-semibold">+${Math.round(lostGrossIncome * 0.5).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-600">
                      <span>Less Student Part-Time Earnings:</span>
                      <span className="font-mono font-semibold">-${Math.round(totalInStudyEarnings).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold text-xs bg-blue-50/70 px-3 rounded-xl text-royal">
                      <span>Total Net Investment to Recoup:</span>
                      <span className="font-mono text-sm">${Math.round(netTotalInvestment).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Assessment Callout */}
                  <div className="p-3.5 rounded-xl bg-white border border-blue-100 shadow-sm space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-royal">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Strategic Recommendation</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      With a projected annual salary jump of <strong className="text-slate-900">+${annualSalaryJump.toLocaleString()}</strong>, your degree breaks even in <strong className="text-royal">{paybackMonths} months</strong>. By year 5, your net financial gain stands at <strong className="text-emerald-600">+${fiveYearNetGain.toLocaleString()}</strong>.
                    </p>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => setActiveTab('loan')}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-royal hover:from-blue-700 hover:to-royal text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Landmark className="w-3.5 h-3.5" />
                      <span>Explore No-Cosigner Loan Financing</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Left Loan Sliders */}
                <div className="lg:col-span-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-emerald-600" /> No-Cosigner Financing Inputs
                    </h3>
                    <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                      MPOWER / Prodigy Finance Model
                    </span>
                  </div>

                  {/* Principal Loan Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Total Borrowing Amount:</span>
                      <span className="font-mono font-bold text-emerald-600 text-sm">${loanPrincipal.toLocaleString()} USD</span>
                    </div>
                    <input
                      type="range"
                      min="5000"
                      max="100000"
                      step="2500"
                      value={loanPrincipal}
                      onChange={(e) => setLoanPrincipal(Number(e.target.value))}
                      className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>$5k</span>
                      <span>Estimated Direct Cost: ${Math.round(directStudyCost).toLocaleString()}</span>
                      <span>$100k Max Cap</span>
                    </div>
                  </div>

                  {/* Fixed APR Interest Rate */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Fixed Annual Interest Rate (APR):</span>
                      <span className="font-mono font-bold text-royal text-sm">{loanInterestRate}%</span>
                    </div>
                    <input
                      type="range"
                      min="7.99"
                      max="16.99"
                      step="0.25"
                      value={loanInterestRate}
                      onChange={(e) => setLoanInterestRate(Number(e.target.value))}
                      className="w-full accent-royal h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 block">Typical international student APR without collateral: 11.5% - 13.99%</span>
                  </div>

                  {/* Loan Repayment Term */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Repayment Term:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">{loanTermYears} Years ({loanTermYears * 12} Months)</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="15"
                      step="1"
                      value={loanTermYears}
                      onChange={(e) => setLoanTermYears(Number(e.target.value))}
                      className="w-full accent-slate-800 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Grace Period Note */}
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Post-Graduation Grace Period</span>
                    </div>
                    <p>
                      Repayment of full principal starts 6 months after graduation. During your degree, you only make minimal interest-only payments (~${Math.round((loanPrincipal * (loanInterestRate / 100)) / 12)}/mo).
                    </p>
                  </div>
                </div>

                {/* Right Loan Summary & Proof-of-Funds Value */}
                <div className="lg:col-span-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-royal" /> Amortization & Debt Feasibility
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Principal Disbursed:</span>
                      <span className="font-mono font-bold">${loanPrincipal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Total Interest (10 Years):</span>
                      <span className="font-mono font-semibold text-rose-600">+${Math.round(totalInterestPaid).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Total Lifetime Repayment:</span>
                      <span className="font-mono font-bold text-slate-900">${Math.round(totalLoanRepaid).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Expected Monthly Post-Grad Pay:</span>
                      <span className="font-mono font-semibold text-emerald-700">${Math.round(monthlyPostGradSalaryGross).toLocaleString()}/mo</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold text-xs bg-emerald-50 px-3 rounded-xl text-emerald-800 border border-emerald-200">
                      <span>Monthly Repayment Obligation:</span>
                      <span className="font-mono text-sm">${Math.round(monthlyLoanPayment)}/mo ({debtToIncomeRatio}% DTI)</span>
                    </div>
                  </div>

                  {/* Visa Proof of Funds Official Acceptance Callout */}
                  <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-sm space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>100% Embassy Visa Compliant</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Loan sanction letters issued by MPOWER Financing and Prodigy Finance are officially recognized as valid Proof of Financial Support for US F-1 visas (I-20), UK Student Visas (CAS), and Canadian Study Permits.
                    </p>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={onClose}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Estimate to Profile</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

