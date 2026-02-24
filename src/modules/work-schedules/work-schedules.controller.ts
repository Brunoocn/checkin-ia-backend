import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { Role } from 'prisma/generated/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { UpsertWorkSchedulesBulkDto } from './dto/upsert-work-schedules-bulk.dto';
import { WorkSchedulesService } from './work-schedules.service';

@Controller('work-schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkSchedulesController {
  constructor(private readonly workSchedulesService: WorkSchedulesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.USER)
  findMyCompany(@CurrentUser() user: AuthenticatedUser) {
    return this.workSchedulesService.findByCompany(user.companyId);
  }

  @Put()
  @Roles(Role.ADMIN)
  upsert(@CurrentUser() admin: AuthenticatedUser, @Body() dto: UpsertWorkSchedulesBulkDto) {
    return this.workSchedulesService.upsert(admin, dto);
  }
}
