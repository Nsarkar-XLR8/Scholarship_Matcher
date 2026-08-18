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
    const codes = codesStr ? codesStr.split(',').map((c) => c.trim()) : ['DE', 'NL', 'GB', 'US'];
    return this.currencyService.compareCountries(codes, currency);
  }

  @Get('rates')
  @ApiOperation({ summary: 'Get live FX conversion rates cached in Redis' })
  async getRates(@Query('base') base = 'USD') {
    return this.currencyService.getExchangeRates(base);
  }
}
