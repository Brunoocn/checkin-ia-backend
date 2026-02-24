import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { UpsertWorkScheduleDto } from './upsert-work-schedule.dto';

export class UpsertWorkSchedulesBulkDto {
  @IsArray()
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => UpsertWorkScheduleDto)
  schedules: UpsertWorkScheduleDto[];
}
