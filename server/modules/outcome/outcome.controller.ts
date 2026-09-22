import { Controller, Post, Get, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { OutcomeService } from './outcome.service';
import { ReportOutcomeDto } from './dto/report-outcome.dto';
import { OutcomeFilterDto } from './dto/outcome-filter.dto';

@ApiTags('Crowdsourced Outcome Reports')
@Controller('api/v1/outcomes')
export class OutcomeController {
  constructor(private readonly outcomeService: OutcomeService) {}

  @Post('report')
  @ApiOperation({ summary: 'Submit an anonymous self-reported admission & scholarship outcome' })
  async reportOutcome(@Body() dto: ReportOutcomeDto, @Req() req: Request) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    return this.outcomeService.submitOutcomeReport(dto, clientIp);
  }

  @Get('distributions')
  @ApiOperation({ summary: 'Get global program yield distributions with multi-parameter filtering' })
  async getAllDistributions(@Query() query: OutcomeFilterDto) {
    return this.outcomeService.getAllProgramDistributions(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get global platform yield macro KPI metrics' })
  async getGlobalStats() {
    return this.outcomeService.getGlobalOutcomeStats();
  }

  @Get('distributions/:programId')
  @ApiOperation({ summary: 'Get 25th, 50th, 75th percentile scholarship yields for a specific program' })
  async getDistributions(@Param('programId') programId: string) {
    return this.outcomeService.getProgramOutcomeDistribution(programId);
  }
}
