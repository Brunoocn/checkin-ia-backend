import { IsDateString } from 'class-validator';

export class AdminSetClockOutDto {
  @IsDateString()
  clockOut: string;
}
