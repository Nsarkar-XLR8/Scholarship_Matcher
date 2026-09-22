import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CurrencyService } from './currency.service';

@ApiTags('Country Comparison & FX Normalization')
@Controller('api/v1/comparison')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('countries')
  @ApiOperation({ summary: 'Compare tuition ranges, living costs & scholarship availability across multiple countries' })
  @ApiQuery({ name: 'codes', example: 'DE,NL,GB,US', description: 'Comma-separated ISO country codes' })
  @ApiQuery({ name: 'currency', example: 'USD', required: false })
  async compareCountries(
    @Query('codes') codesStr: string,
    @Query('currency') currency = 'USD'
  ) {
    const codes = codesStr ? codesStr.split(',').map((c) => c.trim()) : ['DE', 'NL', 'GB', 'US', 'MY', 'CA', 'AU', 'SE', 'SG', 'FR'];
    return this.currencyService.compareCountries(codes, currency);
  }

  @Get('rates')
  @ApiOperation({ summary: 'Get live FX conversion rates cached in Redis' })
  async getRates(@Query('base') base = 'USD') {
    return this.currencyService.getExchangeRates(base);
  }

  @Get('proof-of-funds')
  @ApiOperation({ summary: 'Category B: Get statutory blocked account (Sperrkonto / Proof of Living Funds) requirements with live FX conversion' })
  @ApiQuery({ name: 'codes', example: 'DE,NL,GB,US', required: false })
  @ApiQuery({ name: 'currency', example: 'USD', required: false })
  @ApiQuery({ name: 'scholarshipAnnualAward', example: '0', required: false })
  async getProofOfFunds(
    @Query('codes') codesStr?: string,
    @Query('currency') currency = 'USD',
    @Query('scholarshipAnnualAward') scholarshipAwardStr?: string
  ) {
    const codes = codesStr ? codesStr.split(',').map((c) => c.trim()) : ['DE', 'NL', 'GB', 'US', 'MY', 'CA', 'AU', 'SE', 'SG', 'FR'];
    const scholarshipAward = scholarshipAwardStr ? parseFloat(scholarshipAwardStr) : 0;
    return this.currencyService.getProofOfFundsMatrix(codes, currency, scholarshipAward);
  }

  @Get('loans')
  @ApiOperation({ summary: 'Category B: Estimate collateral-free international loan eligibility and 10-year repayment capacity' })
  @ApiQuery({ name: 'tuitionUsd', example: '35000', required: false })
  @ApiQuery({ name: 'qsRanking', example: '50', required: false })
  @ApiQuery({ name: 'degreeLevel', example: 'MS', required: false })
  @ApiQuery({ name: 'fieldOfStudy', example: 'Computer Science', required: false })
  async getLoanEstimate(
    @Query('tuitionUsd') tuitionUsdStr?: string,
    @Query('qsRanking') qsRankingStr?: string,
    @Query('degreeLevel') degreeLevel = 'MS',
    @Query('fieldOfStudy') fieldOfStudy = 'Computer Science'
  ) {
    const tuitionUsd = tuitionUsdStr ? parseFloat(tuitionUsdStr) : 35000;
    const qsRanking = qsRankingStr ? parseInt(qsRankingStr, 10) : 50;
    return this.currencyService.estimateLoanEligibility(tuitionUsd, qsRanking, degreeLevel, fieldOfStudy);
  }
}
