import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class AdminCreateTimeRecordDto {
  @IsUUID()
  userId: string;

  @IsDateString()
  clockIn: string;

  @IsDateString()
  @IsOptional()
  clockOut?: string;
}
