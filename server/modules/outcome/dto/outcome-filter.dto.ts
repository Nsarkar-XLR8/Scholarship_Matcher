import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class OutcomeFilterDto {
  @ApiProperty({ description: 'Filter by ISO 2-letter country code (e.g. DE, NL, US)', required: false })
  @IsString()
  @IsOptional()
  countryIsoCode?: string;

  @ApiProperty({ description: 'Filter by field of study (e.g. Computer Science, Data Science)', required: false })
  @IsString()
  @IsOptional()
  fieldOfStudy?: string;

  @ApiProperty({ description: 'Filter by admit cycle year (e.g. 2024, 2025, 2026)', required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  cycleYear?: number;

  @ApiProperty({ description: 'Filter by minimum median scholarship percentage (0-100)', required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  minScholarshipPct?: number;

  @ApiProperty({ description: 'Search keyword across program title or university name', required: false })
  @IsString()
  @IsOptional()
  query?: string;
}
