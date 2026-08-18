import { IsNumber, IsString, IsOptional, IsArray, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DegreeLevel } from '@prisma/client';

export class MatchRequestDto {
  @ApiProperty({ example: 3.4, description: 'Student GPA' })
  @IsNumber()
  @Min(0)
  gpa: number;

  @ApiProperty({ example: 4.0, description: 'Original GPA scale (4.0, 5.0, 10.0, or 100)', default: 4.0 })
  @IsNumber()
  @IsOptional()
  gpaScale?: number = 4.0;

  @ApiProperty({ example: 7.0, description: 'IELTS score (0-9)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(9)
  ielts?: number;

  @ApiProperty({ example: 100, description: 'TOEFL score (0-120)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(120)
  toefl?: number;

  @ApiProperty({ example: 320, description: 'GRE score (260-340)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(260)
  @Max(340)
  gre?: number;

  @ApiProperty({ example: 1, description: 'Number of published research papers (DOI verified)', default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  papersCount?: number = 0;

  @ApiProperty({ example: 'Computer Science', description: 'Target field of study (or empty for all fields)', required: false })
  @IsString()
  @IsOptional()
  targetField?: string;

  @ApiProperty({ enum: DegreeLevel, default: DegreeLevel.MS })
  @IsEnum(DegreeLevel)
  @IsOptional()
  targetDegree?: DegreeLevel = DegreeLevel.MS;

  @ApiProperty({ example: ['DE', 'NL', 'GB'], description: 'Preferred ISO country codes', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredCountryIsoCodes?: string[];
}
