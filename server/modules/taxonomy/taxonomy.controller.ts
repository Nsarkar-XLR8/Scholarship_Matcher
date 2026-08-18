import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TaxonomyService } from './taxonomy.service';

@ApiTags('Taxonomy & Geography')
@Controller('api/v1/taxonomy')
export class TaxonomyController {
  constructor(private readonly taxonomyService: TaxonomyService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Get UN M49 Geographic Tree (Continent -> Region -> Country)' })
  async getTree() {
    return this.taxonomyService.getGeographicTree();
  }

  @Get('countries')
  @ApiOperation({ summary: 'Get ISO 3166-1 country catalog with data completeness metrics' })
  async getCountries() {
    return this.taxonomyService.getCountries();
  }

  @Get('countries/:isoCode')
  @ApiOperation({ summary: 'Get country details, universities, and country-scope scholarships' })
  async getCountryByIsoCode(@Param('isoCode') isoCode: string) {
    const country = await this.taxonomyService.getCountryByIsoCode(isoCode);
    if (!country) {
      throw new NotFoundException(`Country with ISO code '${isoCode}' not found`);
    }
    return country;
  }
}
