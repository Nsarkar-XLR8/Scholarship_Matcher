import { IsString, IsOptional, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class SearchRequestDto {
  @ApiProperty({ example: 'Computer Science', description: 'Search keyword', required: false })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiProperty({ example: 'DE', description: 'ISO country code filter', required: false })
  @IsString()
  @IsOptional()
  countryIsoCode?: string;

  @ApiProperty({ example: 'Computer Science', description: 'Field of study filter', required: false })
  @IsString()
  @IsOptional()
  fieldOfStudy?: string;

  @ApiProperty({ example: 'MS', description: 'Degree level filter (MASTERS, MS, MENG, MBA)', required: false })
  @IsString()
  @IsOptional()
  degreeLevel?: string;

  @ApiProperty({ example: 3.5, description: 'Maximum requirement GPA filter', required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxGpaRequirement?: number;

  @ApiProperty({ example: 6.5, description: 'Maximum required IELTS score', required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxIeltsRequirement?: number;

  @ApiProperty({ example: true, description: 'Only programs with published verified scholarships', required: false })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  hasVerifiedScholarshipOnly?: boolean;

  @ApiProperty({ example: 'tuition_asc', description: 'Sort by: relevance, tuition_asc, tuition_desc, title_asc', required: false })
  @IsString()
  @IsOptional()
  sortBy?: 'relevance' | 'tuition_asc' | 'tuition_desc' | 'title_asc';

  @ApiProperty({ example: 20, default: 20 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ example: 0, default: 0 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number = 0;
}
