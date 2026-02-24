import { IsDateString, IsOptional } from 'class-validator';

export class AdminAddBreakDto {
  @IsDateString()
  startedAt: string;

  @IsDateString()
  @IsOptional()
  endedAt?: string;
}
