import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import axios from 'axios';

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
      return { USD: 1.0, EUR: 0.92, GBP: 0.79, MYR: 4.72, CAD: 1.35, AUD: 1.52 };
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
        _count: { select: { universities: true } },
      },
    });

    return countries.map((c) => {
      const nativeToUsdRate = 1.0 / (rates[c.currencyCode] || 1.0);
      const convertedTuitionMin = c.avgTuitionMinUsd * targetRate;
      const convertedTuitionMax = c.avgTuitionMaxUsd * targetRate;
      const convertedLivingCost = c.estMonthlyLivingCostUsd * targetRate;

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
      };
    });
  }
}
