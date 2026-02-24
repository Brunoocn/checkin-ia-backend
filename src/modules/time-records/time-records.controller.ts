import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from 'prisma/generated/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AdminAddBreakDto } from './dto/admin-add-break.dto';
import { AdminCreateTimeRecordDto } from './dto/admin-create-time-record.dto';
import { AdminEditBreakDto } from './dto/admin-edit-break.dto';
import { AdminSetClockOutDto } from './dto/admin-set-clock-out.dto';
import { TimeRecordsService } from './time-records.service';

@Controller('time-records')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimeRecordsController {
  constructor(private readonly timeRecordsService: TimeRecordsService) {}

  @Post('clock-in')
  @Roles(Role.ADMIN, Role.USER)
  clockIn(@CurrentUser() user: AuthenticatedUser) {
    return this.timeRecordsService.clockIn(user);
  }

  @Patch('clock-out')
  @Roles(Role.ADMIN, Role.USER)
  clockOut(@CurrentUser() user: AuthenticatedUser) {
    return this.timeRecordsService.clockOut(user);
  }

  @Post('breaks/start')
  @Roles(Role.ADMIN, Role.USER)
  startBreak(@CurrentUser() user: AuthenticatedUser) {
    return this.timeRecordsService.startBreak(user);
  }

  @Patch('breaks/end')
  @Roles(Role.ADMIN, Role.USER)
  endBreak(@CurrentUser() user: AuthenticatedUser) {
    return this.timeRecordsService.endBreak(user);
  }

  @Get('me')
  @Roles(Role.ADMIN, Role.USER)
  findMyRecords(@CurrentUser() user: AuthenticatedUser) {
    return this.timeRecordsService.findByUser(user.id);
  }

  @Get('me/:date')
  @Roles(Role.ADMIN, Role.USER)
  findMyRecordByDate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('date') date: string,
  ) {
    return this.timeRecordsService.findByUserAndDate(user.id, date);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll(@CurrentUser() admin: AuthenticatedUser) {
    return this.timeRecordsService.findAll(admin);
  }

  @Post()
  @Roles(Role.ADMIN)
  adminCreate(
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: AdminCreateTimeRecordDto,
  ) {
    return this.timeRecordsService.adminCreate(admin, dto);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string) {
    return this.timeRecordsService.findOne(admin, id);
  }

  @Patch(':id/clock-out')
  @Roles(Role.ADMIN)
  adminSetClockOut(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AdminSetClockOutDto,
  ) {
    return this.timeRecordsService.adminSetClockOut(admin, id, dto);
  }

  @Post(':id/breaks')
  @Roles(Role.ADMIN)
  adminAddBreak(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AdminAddBreakDto,
  ) {
    return this.timeRecordsService.adminAddBreak(admin, id, dto);
  }

  @Patch(':id/breaks/:breakId')
  @Roles(Role.ADMIN)
  adminEditBreak(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Param('breakId') breakId: string,
    @Body() dto: AdminEditBreakDto,
  ) {
    return this.timeRecordsService.adminEditBreak(admin, id, breakId, dto);
  }
}
