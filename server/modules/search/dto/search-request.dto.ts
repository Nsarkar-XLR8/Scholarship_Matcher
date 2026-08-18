import { IsString, IsOptional, IsNumber, Min, Max, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ example: 3.5, description: 'Maximum requirement GPA filter', required: false })
  @IsNumber()
  @IsOptional()
  maxGpaRequirement?: number;

  @ApiProperty({ example: true, description: 'Only programs with published verified scholarships', required: false })
  @IsBoolean()
  @IsOptional()
  hasVerifiedScholarshipOnly?: boolean;

  @ApiProperty({ example: 20, default: 20 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ example: 0, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number = 0;
}
