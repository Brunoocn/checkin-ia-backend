import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { PrismaService } from '../database/prisma.service';
import { UpsertWorkSchedulesBulkDto } from './dto/upsert-work-schedules-bulk.dto';

@Injectable()
export class WorkSchedulesService {
  constructor(private prisma: PrismaService) {}

  async findByCompany(companyId: string) {
    try {
      return await this.prisma.workSchedule.findMany({
        where: { companyId },
        orderBy: { dayOfWeek: 'asc' },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Erro ao buscar horários de trabalho.');
    }
  }

  async upsert(admin: AuthenticatedUser, dto: UpsertWorkSchedulesBulkDto) {
    try {
      const companyId = admin.companyId;

      const days = dto.schedules.map((s) => s.dayOfWeek);
      if (new Set(days).size !== 7) {
        throw new BadRequestException('O payload deve conter exatamente 7 dias únicos.');
      }

      const results = await this.prisma.$transaction(
        dto.schedules.map((s) =>
          this.prisma.workSchedule.upsert({
            where: {
              companyId_dayOfWeek: { companyId, dayOfWeek: s.dayOfWeek },
            },
            update: {
              isWorkday: s.isWorkday,
              startTime: s.isWorkday ? (s.startTime ?? null) : null,
              endTime: s.isWorkday ? (s.endTime ?? null) : null,
            },
            create: {
              companyId,
              dayOfWeek: s.dayOfWeek,
              isWorkday: s.isWorkday,
              startTime: s.isWorkday ? (s.startTime ?? null) : null,
              endTime: s.isWorkday ? (s.endTime ?? null) : null,
            },
          }),
        ),
      );

      return results;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Erro ao salvar horários de trabalho.');
    }
  }
}
