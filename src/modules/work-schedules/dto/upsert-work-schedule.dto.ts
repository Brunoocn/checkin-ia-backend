import { IsBoolean, IsEnum, IsString, Matches, ValidateIf } from 'class-validator';
import { DayOfWeek } from 'prisma/generated/client';

export class UpsertWorkScheduleDto {
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @IsBoolean()
  isWorkday: boolean;

  @ValidateIf((o) => o.isWorkday === true)
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime deve estar no formato HH:MM',
  })
  startTime?: string;

  @ValidateIf((o) => o.isWorkday === true)
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime deve estar no formato HH:MM',
  })
  endTime?: string;
}
