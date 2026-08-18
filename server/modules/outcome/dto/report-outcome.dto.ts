import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportOutcomeDto {
  @ApiProperty({ example: 'prog-uuid-here', description: 'Program ID' })
  @IsString()
  programId: string;

  @ApiProperty({ example: 3.7, description: 'Undergraduate GPA' })
  @IsNumber()
  @Min(0)
  reportedGpa: number;

  @ApiProperty({ example: 4.0, description: 'Original GPA scale', default: 4.0 })
  @IsNumber()
  @IsOptional()
  reportedGpaScale?: number = 4.0;

  @ApiProperty({ example: 7.5, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(9)
  reportedIelts?: number;

  @ApiProperty({ example: 105, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(120)
  reportedToefl?: number;

  @ApiProperty({ example: 325, required: false })
  @IsNumber()
  @IsOptional()
  @Min(260)
  @Max(340)
  reportedGre?: number;

  @ApiProperty({ example: 1, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  reportedPapersCount?: number = 0;

  @ApiProperty({ example: 50.0, description: 'Scholarship percentage awarded (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  scholarshipPctReceived: number;

  @ApiProperty({ example: 2024, description: 'Admit cycle year e.g. 2024' })
  @IsNumber()
  @Min(2000)
  @Max(2030)
  admitCycleYear: number;
}
