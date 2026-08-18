import { Controller, Get, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UniversityService } from './university.service';

@ApiTags('Universities & Programs')
@Controller('api/v1')
export class UniversityController {
  constructor(private readonly universityService: UniversityService) {}

  @Get('universities')
  @ApiOperation({ summary: 'List universities with pagination and country filtering' })
  @ApiQuery({ name: 'country', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getUniversities(
    @Query('country') country?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number
  ) {
    return this.universityService.getUniversities(country, limit, offset);
  }

  @Get('universities/:id')
  @ApiOperation({ summary: 'Get full details of a university including multi-campuses and programs' })
  async getUniversityById(@Param('id') id: string) {
    return this.universityService.getUniversityById(id);
  }

  @Get('programs/:id')
  @ApiOperation({ summary: 'Get program details with requirement versioning history & scholarship rules' })
  async getProgramById(@Param('id') id: string) {
    return this.universityService.getProgramById(id);
  }
}
