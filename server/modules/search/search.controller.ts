import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchRequestDto } from './dto/search-request.dto';

@ApiTags('Faceted Search Engine')
@Controller('api/v1/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('programs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search programs across countries, fields, requirements, & scholarship availability' })
  async searchPrograms(@Body() dto: SearchRequestDto) {
    return this.searchService.searchPrograms(dto);
  }
}
