import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import { MatchRequestDto } from './dto/match-request.dto';

@ApiTags('Eligibility & Matching Engine')
@Controller('api/v1/match')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Evaluate student profile against master programs & multi-scoped scholarship rules' })
  @ApiResponse({ status: 200, description: 'Evaluation successful with qualification status and scholarship probability ranges.' })
  async evaluateMatch(@Body() dto: MatchRequestDto) {
    return this.matchingService.evaluateStudentProfile(dto);
  }
}
