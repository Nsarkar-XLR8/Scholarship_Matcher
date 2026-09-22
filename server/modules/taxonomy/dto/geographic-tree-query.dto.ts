import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class GeographicTreeQueryDto {
  @ApiProperty({ description: 'Search query across program title, university, or field of study', required: false })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiProperty({ description: 'Filter by field of study (e.g. Computer Science, Data Science)', required: false })
  @IsString()
  @IsOptional()
  fieldOfStudy?: string;

  @ApiProperty({ description: 'Filter by degree level (e.g. MASTERS, MS, MENG, MBA)', required: false })
  @IsString()
  @IsOptional()
  degreeLevel?: string;

  @ApiProperty({ description: 'Filter by continent code (e.g. EU, NA, AS, OC)', required: false })
  @IsString()
  @IsOptional()
  continentCode?: string;

  @ApiProperty({ description: 'Filter by ISO 2-letter country code (e.g. DE, NL, US)', required: false })
  @IsString()
  @IsOptional()
  countryIsoCode?: string;

  @ApiProperty({ description: 'Filter by maximum GPA requirement', required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxGpa?: number;

  @ApiProperty({ description: 'Filter only programs with verified scholarships', required: false })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  hasScholarshipOnly?: boolean;
}
