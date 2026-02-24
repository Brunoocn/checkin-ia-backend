import { IsDateString, IsOptional } from 'class-validator';

export class AdminEditBreakDto {
  @IsDateString()
  @IsOptional()
  startedAt?: string;

  @IsDateString()
  @IsOptional()
  endedAt?: string;
}
