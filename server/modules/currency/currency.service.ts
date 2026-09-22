import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import axios from 'axios';

export interface StatutoryProofOfFundsItem {
  countryIsoCode: string;
  countryName: string;
  nativeCurrency: string;
  displayCurrency: string;
  statutoryMonthlyLocal: number;
  statutoryAnnualLocal: number;
  statutoryMonthlyConverted: number;
  statutoryAnnualConverted: number;
  mandatoryInsuranceBufferConverted: number;
  recommendedFxBufferConverted: number;
  totalStatutoryDepositRequired: number;
  durationMonthsRequired: number;
  permitRegulationName: string;
  netBlockedDepositAfterScholarship?: {
    scholarshipAnnualStipend: number;
    netBlockedDepositRequired: number;
    isFullyWaivedByScholarship: boolean;
  };
}

export interface LoanEstimationResult {
  universityRanking: number;
  degreeLevel: string;
  isEligibleForNoCosignerLoan: boolean;
  lenderOptions: string[];
  maxEstimatedBorrowingCapacityUsd: number;
  estimatedInterestRatePct: number;
  estimatedMonthlyRepayment10YrUsd: number;
  totalRepayment10YrUsd: number;
  summary: string;
}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  /**
   * Fetches live FX exchange rates using Frankfurter API with Redis 24h caching
   */
  async getExchangeRates(baseCurrency = 'USD'): Promise<Record<string, number>> {
    const cacheKey = `fx_rates:${baseCurrency.toUpperCase()}`;
    const cached = await this.redis.get<Record<string, number>>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${process.env.FRANKFURTER_FX_URL || 'https://api.frankfurter.app'}/latest?from=${baseCurrency.toUpperCase()}`;
      const response = await axios.get(url, { timeout: 5000 });
      const rates = { [baseCurrency.toUpperCase()]: 1.0, ...response.data.rates };

      await this.redis.set(cacheKey, rates, 86400); // 24 hour TTL
      return rates;
    } catch (error) {
      this.logger.warn(`Failed to fetch FX rates from Frankfurter. Using fallback rates:`, error.message);
      // Hardcoded fallback exchange rates
      return { USD: 1.0, EUR: 0.92, GBP: 0.79, MYR: 4.72, CAD: 1.35, AUD: 1.52, SEK: 10.45, SGD: 1.34 };
    }
  }

  /**
   * Returns normalized multi-country side-by-side comparison table
   */
  async compareCountries(isoCodes: string[], targetCurrency = 'USD') {
    const rates = await this.getExchangeRates('USD');
    const targetRate = rates[targetCurrency.toUpperCase()] || 1.0;

    const countries = await this.prisma.country.findMany({
      where: {
        isoCode: { in: isoCodes.map((code) => code.toUpperCase()) },
      },
      include: {
        region: { include: { continent: true } },
        scholarshipRules: true,
        workAndVisaProfile: true,
        _count: { select: { universities: true } },
      },
    });

    // Comprehensive industry intelligence dictionary for destination countries
    const industryCountryIntelligence: Record<string, {

      studentMinWageHourlyLocal: number;
      minWageCurrency: string;
      inStudyWorkLimitFormatted: string;
      taxFreeAllowanceAnnualLocal: number;
      spousalWorkRightsPolicy: string;
      spouseWorkAllowed: boolean;
      permanentResidencyPathway: string;
      prTimelineYears: number;
      mandatoryHealthcareMonthlyLocal: number;
      healthcareCurrency: string;
      englishProficiencyRank: string;
      housingStrainIndex: 'MODERATE' | 'HIGH' | 'CRITICAL';
    }> = {
      DE: {
        studentMinWageHourlyLocal: 12.82,
        minWageCurrency: 'EUR',
        inStudyWorkLimitFormatted: '140 full days (or 280 half days) per calendar year / 20 hrs/wk during semester',
        taxFreeAllowanceAnnualLocal: 6456, // €538/month Minijob limit
        spousalWorkRightsPolicy: 'Full unrestricted open work permit for accompanying spouse (§30 AufenthG)',
        spouseWorkAllowed: true,
        permanentResidencyPathway: 'Fast-track Settlement Permit (§18b/§18c) after 21-24 months of skilled work with B1 German (EU Blue Card)',
        prTimelineYears: 2,
        mandatoryHealthcareMonthlyLocal: 125,
        healthcareCurrency: 'EUR',
        englishProficiencyRank: 'High (EF EPI #15)',
        housingStrainIndex: 'HIGH',
      },
      NL: {
        studentMinWageHourlyLocal: 13.27,
        minWageCurrency: 'EUR',
        inStudyWorkLimitFormatted: '16 hrs/week (requires TWV employer permit) or full-time June-August',
        taxFreeAllowanceAnnualLocal: 8700,
        spousalWorkRightsPolicy: 'Work permit tied to main applicant; open work permitted after Zoekjaar conversion',
        spouseWorkAllowed: true,
        permanentResidencyPathway: 'EU Blue Card or 5-year permanent residence after graduation + Zoekjaar search year employment',
        prTimelineYears: 5,
        mandatoryHealthcareMonthlyLocal: 65,
        healthcareCurrency: 'EUR',
        englishProficiencyRank: 'Very High (EF EPI #1 Worldwide)',
        housingStrainIndex: 'CRITICAL',
      },
      GB: {
        studentMinWageHourlyLocal: 11.44,
        minWageCurrency: 'GBP',
        inStudyWorkLimitFormatted: '20 hrs/week during term-time, full-time during official vacations',
        taxFreeAllowanceAnnualLocal: 12570, // UK Personal Allowance
        spousalWorkRightsPolicy: 'Restricted for taught Master’s since Jan 2024 (Permitted for PhD & Research Master’s only)',
        spouseWorkAllowed: false,
        permanentResidencyPathway: 'Graduate Route (24m) -> 5-year Skilled Worker sponsorship route to Indefinite Leave to Remain (ILR)',
        prTimelineYears: 5,
        mandatoryHealthcareMonthlyLocal: 65, // £776/year NHS Surcharge
        healthcareCurrency: 'GBP',
        englishProficiencyRank: 'Native / Official',
        housingStrainIndex: 'HIGH',
      },
      US: {
        studentMinWageHourlyLocal: 15.00,
        minWageCurrency: 'USD',
        inStudyWorkLimitFormatted: '20 hrs/week on-campus only during semester; off-campus CPT after 1 academic year',
        taxFreeAllowanceAnnualLocal: 13850,
        spousalWorkRightsPolicy: 'F-2 visa holders strictly prohibited from employment; J-2 dependants eligible for EAD',
        spouseWorkAllowed: false,
        permanentResidencyPathway: 'OPT (1-3 yrs) -> H-1B lottery -> EB-2 / EB-3 PERM Green Card employer sponsorship',
        prTimelineYears: 6,
        mandatoryHealthcareMonthlyLocal: 250,
        healthcareCurrency: 'USD',
        englishProficiencyRank: 'Native / Official',
        housingStrainIndex: 'HIGH',
      },
      CA: {
        studentMinWageHourlyLocal: 17.30,
        minWageCurrency: 'CAD',
        inStudyWorkLimitFormatted: '24 hrs/week off-campus during academic terms (IRCC 2024 policy), full-time during breaks',
        taxFreeAllowanceAnnualLocal: 15000,
        spousalWorkRightsPolicy: 'Open work permit eligible for Master’s programs of 16+ months duration',
        spouseWorkAllowed: true,
        permanentResidencyPathway: 'PGWP (up to 3 yrs) -> Express Entry Canadian Experience Class (CEC) + Provincial Nominees (PNP)',
        prTimelineYears: 2.5,
        mandatoryHealthcareMonthlyLocal: 75,
        healthcareCurrency: 'CAD',
        englishProficiencyRank: 'Native / Official',
        housingStrainIndex: 'CRITICAL',
      },
      AU: {
        studentMinWageHourlyLocal: 23.23,
        minWageCurrency: 'AUD',
        inStudyWorkLimitFormatted: '48 hrs per fortnight (24 hrs/week) during study terms, unlimited during breaks',
        taxFreeAllowanceAnnualLocal: 18200,
        spousalWorkRightsPolicy: 'Full unrestricted work rights for Master’s degree student dependants (Subclass 500)',
        spouseWorkAllowed: true,
        permanentResidencyPathway: 'Subclass 485 Temporary Graduate -> Points-tested Subclass 189/190/491 Skilled Independent PR',
        prTimelineYears: 3,
        mandatoryHealthcareMonthlyLocal: 55,
        healthcareCurrency: 'AUD',
        englishProficiencyRank: 'Native / Official',
        housingStrainIndex: 'CRITICAL',
      },
      SE: {
        studentMinWageHourlyLocal: 140.0,
        minWageCurrency: 'SEK',
        inStudyWorkLimitFormatted: 'No statutory hourly limit (full-time permitted, 20 hrs/week recommended to maintain ECTS pace)',
        taxFreeAllowanceAnnualLocal: 22200,
        spousalWorkRightsPolicy: 'Full open work permit for spouse if main student permit is >= 6 months',
        spouseWorkAllowed: true,
        permanentResidencyPathway: '1-year stayback -> 4 years of skilled work permit employment leads to Permanent Residence',
        prTimelineYears: 4,
        mandatoryHealthcareMonthlyLocal: 0, // Free for >= 12mo degree students with Swedish Personnummer
        healthcareCurrency: 'SEK',
        englishProficiencyRank: 'Very High (EF EPI #4 Worldwide)',
        housingStrainIndex: 'HIGH',
      },
      SG: {
        studentMinWageHourlyLocal: 12.00,
        minWageCurrency: 'SGD',
        inStudyWorkLimitFormatted: '16 hrs/week during term-time at MOM-approved autonomous universities',
        taxFreeAllowanceAnnualLocal: 20000,
        spousalWorkRightsPolicy: 'Long Term Visit Pass (LTVP) - requires separate work pass or LOC for employment',
        spouseWorkAllowed: false,
        permanentResidencyPathway: '1-year LTVP stayback -> Employment Pass (EP) / ONE Pass -> PTS Permanent Residency application',
        prTimelineYears: 3,
        mandatoryHealthcareMonthlyLocal: 40,
        healthcareCurrency: 'SGD',
        englishProficiencyRank: 'Very High (EF EPI #2 Worldwide)',
        housingStrainIndex: 'HIGH',
      },
      FR: {
        studentMinWageHourlyLocal: 11.65,
        minWageCurrency: 'EUR',
        inStudyWorkLimitFormatted: 'Up to 60% of annual working time (964 hours per year / ~20 hrs/week)',
        taxFreeAllowanceAnnualLocal: 10777,
        spousalWorkRightsPolicy: 'Accompanying spouse on long-stay visitor visa requires separate work authorization',
        spouseWorkAllowed: false,
        permanentResidencyPathway: '12m RECE / APS stayback -> Passeport Talent -> 5-year EU Resident Card (Fast-track citizenship after 2yr Master’s)',
        prTimelineYears: 3,
        mandatoryHealthcareMonthlyLocal: 0, // Free French Social Security (CPAM) for students
        healthcareCurrency: 'EUR',
        englishProficiencyRank: 'Moderate (EF EPI #30)',
        housingStrainIndex: 'HIGH',
      },
      MY: {
        studentMinWageHourlyLocal: 8.50,
        minWageCurrency: 'MYR',
        inStudyWorkLimitFormatted: '20 hrs/week during semester breaks exceeding 7 days in approved hospitality/retail sectors',
        taxFreeAllowanceAnnualLocal: 5000,
        spousalWorkRightsPolicy: 'Dependent Pass holders cannot work without separate employment pass endorsement',
        spouseWorkAllowed: false,
        permanentResidencyPathway: 'Employment Pass (EP) Category 1 -> Resident Pass-Talent (RP-T) 10-year renewable visa',
        prTimelineYears: 5,
        mandatoryHealthcareMonthlyLocal: 45,
        healthcareCurrency: 'MYR',
        englishProficiencyRank: 'High (EF EPI #25)',
        housingStrainIndex: 'MODERATE',
      },
    };

    return countries.map((c) => {
      const convertedTuitionMin = c.avgTuitionMinUsd * targetRate;
      const convertedTuitionMax = c.avgTuitionMaxUsd * targetRate;
      const convertedLivingCost = c.estMonthlyLivingCostUsd * targetRate;
      const convertedSalary = (c.workAndVisaProfile?.medianGraduateSalaryUsd || 55000) * targetRate;

      // Calculate total 2-year masters investment (average tuition + 24 months living cost)
      const avgAnnualTuition = (convertedTuitionMin + convertedTuitionMax) / 2;
      const totalEstimatedInvestment2Yr = Math.round(avgAnnualTuition * 2 + convertedLivingCost * 24);
      
      // Payback calculation (assuming 40% of gross post-grad salary allocated to repayment/savings)
      const estimatedAnnualSavingsCapacity = Math.max(10000, convertedSalary * 0.4);
      const estimatedPaybackYears = parseFloat((totalEstimatedInvestment2Yr / estimatedAnnualSavingsCapacity).toFixed(1));

      // Industry intelligence mapping
      const intel = industryCountryIntelligence[c.isoCode] || {
        studentMinWageHourlyLocal: 12.0,
        minWageCurrency: c.currencyCode,
        inStudyWorkLimitFormatted: '20 hrs/week during academic terms',
        taxFreeAllowanceAnnualLocal: 10000,
        spousalWorkRightsPolicy: 'Standard national regulations apply',
        spouseWorkAllowed: false,
        permanentResidencyPathway: 'Standard skilled work visa to settlement',
        prTimelineYears: 5,
        mandatoryHealthcareMonthlyLocal: 50,
        healthcareCurrency: c.currencyCode,
        englishProficiencyRank: 'Standard',
        housingStrainIndex: 'MODERATE',
      };

      // Currency conversions for wage and healthcare
      const minWageToUsdRate = rates[intel.minWageCurrency.toUpperCase()] ? 1.0 / rates[intel.minWageCurrency.toUpperCase()] : 1.0;
      const convertedMinWage = Math.round(intel.studentMinWageHourlyLocal * minWageToUsdRate * targetRate * 100) / 100;

      const healthToUsdRate = rates[intel.healthcareCurrency.toUpperCase()] ? 1.0 / rates[intel.healthcareCurrency.toUpperCase()] : 1.0;
      const convertedHealthcare = Math.round(intel.mandatoryHealthcareMonthlyLocal * healthToUsdRate * targetRate);

      return {
        isoCode: c.isoCode,
        countryName: c.name,
        regionName: c.region.name,
        continentName: c.region.continent.name,
        nativeCurrency: c.currencyCode,
        displayCurrency: targetCurrency.toUpperCase(),
        tuitionRangeAnnual: {
          min: Math.round(convertedTuitionMin),
          max: Math.round(convertedTuitionMax),
        },
        estMonthlyLivingCost: Math.round(convertedLivingCost),
        universitiesCount: c._count.universities,
        countryScholarshipsCount: c.scholarshipRules.length,
        dataCompletenessPct: c.dataCompletenessPct,
        visaAndWorkProfile: c.workAndVisaProfile ? {
          postStudyWorkMonths: c.workAndVisaProfile.postStudyWorkMonths,
          permitName: c.workAndVisaProfile.postStudyWorkPermitName,
          inStudyWorkHoursWeekly: c.workAndVisaProfile.inStudyWorkHoursPerWeek,
          allowsSpouseWork: c.workAndVisaProfile.allowsSpouseWorkVisa,
          pathwayToPR: c.workAndVisaProfile.pathwayToPermanentRes,
          medianGraduateSalary: Math.round(convertedSalary),
          totalEstimatedInvestment2Yr,
          estimatedPaybackYears,
          monthlyBlockedAccountLocal: (c.workAndVisaProfile as any).monthlyBlockedAccountLocal || 0,
          blockedAccountCurrency: (c.workAndVisaProfile as any).blockedAccountCurrency || c.currencyCode,
          requiresApsCertificate: (c.workAndVisaProfile as any).requiresApsCertificate || false,
          anabinRecognitionType: (c.workAndVisaProfile as any).anabinRecognitionType || 'H+',
        } : null,
        // Enriched Industry Metrics
        industryIntelligence: {
          studentMinWageHourlyLocal: intel.studentMinWageHourlyLocal,
          minWageCurrency: intel.minWageCurrency,
          studentMinWageHourlyConverted: convertedMinWage,
          inStudyWorkLimitFormatted: intel.inStudyWorkLimitFormatted,
          taxFreeAllowanceAnnualLocal: intel.taxFreeAllowanceAnnualLocal,
          spousalWorkRightsPolicy: intel.spousalWorkRightsPolicy,
          spouseWorkAllowed: intel.spouseWorkAllowed,
          permanentResidencyPathway: intel.permanentResidencyPathway,
          prTimelineYears: intel.prTimelineYears,
          mandatoryHealthcareMonthlyLocal: intel.mandatoryHealthcareMonthlyLocal,
          mandatoryHealthcareMonthlyConverted: convertedHealthcare,
          healthcareCurrency: intel.healthcareCurrency,
          englishProficiencyRank: intel.englishProficiencyRank,
          housingStrainIndex: intel.housingStrainIndex,
        },
      };
    });
  }

  /**

   * Category B: Statutory Blocked Account (Sperrkonto / Proof of Living Funds) Calculator
   * Returns exact statutory visa escrow requirements with live FX conversion and scholarship offset deductions.
   */
  async getProofOfFundsMatrix(
    isoCodes: string[] = ['DE', 'NL', 'GB', 'US', 'MY', 'CA', 'AU', 'SE', 'SG', 'FR'],
    targetCurrency = 'USD',
    scholarshipAnnualAward = 0
  ): Promise<StatutoryProofOfFundsItem[]> {
    const rates = await this.getExchangeRates('USD');
    const targetRate = rates[targetCurrency.toUpperCase()] || 1.0;

    // Standard country regulatory defaults
    const regulatoryDefaults: Record<string, { monthlyLocal: number; currency: string; months: number; name: string }> = {
      DE: { monthlyLocal: 992, currency: 'EUR', months: 12, name: 'Sperrkonto §16b AufenthG (Federal Blocked Account)' },
      NL: { monthlyLocal: 1208, currency: 'EUR', months: 12, name: 'IND Proof of Sufficient Means (Study Visa Escrow)' },
      GB: { monthlyLocal: 1023, currency: 'GBP', months: 9, name: 'UKVI Student Visa Financial Maintenance' },
      US: { monthlyLocal: 2200, currency: 'USD', months: 12, name: 'SEVIS Form I-20 Cost of Attendance Liquid Funds' },
      MY: { monthlyLocal: 2500, currency: 'MYR', months: 12, name: 'EMGS Student Pass Financial Guarantee' },
      CA: { monthlyLocal: 1720, currency: 'CAD', months: 12, name: 'IRCC Study Permit Minimum Living Expense (GIC)' },
      AU: { monthlyLocal: 2475, currency: 'AUD', months: 12, name: 'Subclass 500 Financial Capacity Requirement' },
      SE: { monthlyLocal: 10350, currency: 'SEK', months: 10, name: 'Migrationsverket Maintenance Requirement' },
      SG: { monthlyLocal: 2000, currency: 'SGD', months: 12, name: 'ICA Student Pass Living Support Deposit' },
      FR: { monthlyLocal: 615, currency: 'EUR', months: 12, name: 'OFII Minimum Resource Requirement for Long-Stay Visa' },
    };

    const countries = await this.prisma.country.findMany({
      where: {
        isoCode: { in: isoCodes.map((code) => code.toUpperCase()) },
      },
      include: {
        workAndVisaProfile: true,
      },
    });

    return countries.map((country) => {
      const code = country.isoCode;
      const def = regulatoryDefaults[code] || {
        monthlyLocal: country.estMonthlyLivingCostUsd,
        currency: 'USD',
        months: 12,
        name: 'Standard Proof of Living Funds',
      };

      const monthlyLocal = (country.workAndVisaProfile as any)?.monthlyBlockedAccountLocal || def.monthlyLocal;
      const monthsRequired = (country.workAndVisaProfile as any)?.proofOfFundsMonths || def.months;
      const nativeCurrency = (country.workAndVisaProfile as any)?.blockedAccountCurrency || def.currency;
      const annualLocal = monthlyLocal * monthsRequired;

      // Currency conversion from native to target currency
      const nativeToUsdRate = rates[nativeCurrency.toUpperCase()] ? 1.0 / rates[nativeCurrency.toUpperCase()] : 1.0;
      const monthlyConverted = Math.round(monthlyLocal * nativeToUsdRate * targetRate);
      const annualConverted = Math.round(annualLocal * nativeToUsdRate * targetRate);

      // Mandatory health insurance buffer (~$120/month equivalent) and 3% FX buffer
      const mandatoryInsuranceBuffer = Math.round(120 * monthsRequired * targetRate);
      const recommendedFxBuffer = Math.round(annualConverted * 0.03);
      const totalStatutoryDeposit = annualConverted + mandatoryInsuranceBuffer + recommendedFxBuffer;

      // Calculate dollar-for-dollar scholarship offset
      const scholarshipConverted = Math.round(scholarshipAnnualAward * targetRate);
      const netBlockedDeposit = Math.max(0, totalStatutoryDeposit - scholarshipConverted);

      return {
        countryIsoCode: code,
        countryName: country.name,
        nativeCurrency,
        displayCurrency: targetCurrency.toUpperCase(),
        statutoryMonthlyLocal: monthlyLocal,
        statutoryAnnualLocal: annualLocal,
        statutoryMonthlyConverted: monthlyConverted,
        statutoryAnnualConverted: annualConverted,
        mandatoryInsuranceBufferConverted: mandatoryInsuranceBuffer,
        recommendedFxBufferConverted: recommendedFxBuffer,
        totalStatutoryDepositRequired: totalStatutoryDeposit,
        durationMonthsRequired: monthsRequired,
        permitRegulationName: def.name,
        netBlockedDepositAfterScholarship: {
          scholarshipAnnualStipend: scholarshipConverted,
          netBlockedDepositRequired: netBlockedDeposit,
          isFullyWaivedByScholarship: netBlockedDeposit === 0,
        },
      };
    });
  }

  /**
   * Category B: International No-Cosigner Loan & Aid Eligibility Estimator
   */
  estimateLoanEligibility(
    tuitionFeeUsd = 30000,
    qsRanking = 50,
    degreeLevel = 'MS',
    fieldOfStudy = 'Computer Science'
  ): LoanEstimationResult {
    const isTop500 = qsRanking > 0 && qsRanking <= 500;
    const isStemOrBusiness = /computer|data|engineering|science|analytics|mba|finance/i.test(fieldOfStudy);
    const isEligible = isTop500 && isStemOrBusiness;

    const lenders = isEligible
      ? ['MPOWER Financing (No Co-signer / No Collateral)', 'Prodigy Finance (Global Master’s Portfolio)']
      : ['Local Institutional Aid / National Co-signer Loan'];

    const maxBorrowing = isEligible ? Math.min(100000, Math.round(tuitionFeeUsd * 1.5)) : 0;
    const interestRatePct = isEligible ? 12.25 : 14.5;

    // Standard 10-year monthly loan payment calculation: P * r * (1+r)^n / ((1+r)^n - 1)
    const monthlyRate = (interestRatePct / 100) / 12;
    const numberOfPayments = 120;
    const monthlyPayment = isEligible
      ? Math.round((maxBorrowing * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1))
      : 0;
    const totalRepayment = monthlyPayment * 120;

    return {
      universityRanking: qsRanking,
      degreeLevel,
      isEligibleForNoCosignerLoan: isEligible,
      lenderOptions: lenders,
      maxEstimatedBorrowingCapacityUsd: maxBorrowing,
      estimatedInterestRatePct: interestRatePct,
      estimatedMonthlyRepayment10YrUsd: monthlyPayment,
      totalRepayment10YrUsd: totalRepayment,
      summary: isEligible
        ? `Eligible for collateral-free international student financing up to $${maxBorrowing.toLocaleString()} USD via MPOWER and Prodigy Finance based on university ranking (QS #${qsRanking}) and ${fieldOfStudy} designation.`
        : `Institution ranking (QS #${qsRanking}) is outside collateral-free international underwriting lists. Local co-signer or institutional aid required.`,
    };
  }
}
