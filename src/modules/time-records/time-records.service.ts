import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { PrismaService } from '../database/prisma.service';
import { AdminAddBreakDto } from './dto/admin-add-break.dto';
import { AdminCreateTimeRecordDto } from './dto/admin-create-time-record.dto';
import { AdminEditBreakDto } from './dto/admin-edit-break.dto';
import { AdminSetClockOutDto } from './dto/admin-set-clock-out.dto';

function toUtcDate(input: Date | string): Date {
  const d = new Date(input);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

@Injectable()
export class TimeRecordsService {
  constructor(private prisma: PrismaService) {}

  async punch(user: AuthenticatedUser) {
    try {
      if (!user.companyId) {
        throw new ForbiddenException(
          'Usuário não está vinculado a uma empresa.',
        );
      }

      const today = toUtcDate(new Date());
      const now = new Date();

      const record = await this.prisma.timeRecord.findFirst({
        where: { userId: user.id, date: today, deletedAt: null },
        include: { breaks: { where: { endedAt: null } } },
      });

      if (!record) {
        return await this.prisma.timeRecord.create({
          data: {
            userId: user.id,
            companyId: user.companyId,
            date: today,
            clockIn: now,
          },
          include: { breaks: true },
        });
      }

      if (!record.clockOut) {
        return await this.prisma.timeRecord.update({
          where: { id: record.id },
          data: { clockOut: now },
          include: { breaks: true },
        });
      }

      const openBreak = record.breaks[0] ?? null;

      if (!openBreak) {
        const breakStartedAt = record.clockOut;
        await this.prisma.breakRecord.create({
          data: { timeRecordId: record.id, startedAt: breakStartedAt },
        });
        return await this.prisma.timeRecord.update({
          where: { id: record.id },
          data: { clockOut: now },
          include: { breaks: true },
        });
      }

      const breakEndedAt = record.clockOut;
      await this.prisma.breakRecord.update({
        where: { id: openBreak.id },
        data: { endedAt: breakEndedAt },
      });
      return await this.prisma.timeRecord.update({
        where: { id: record.id },
        data: { clockOut: now },
        include: { breaks: true },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Erro ao registrar ponto.');
    }
  }

  async findByUser(userId: string) {
    try {
      return await this.prisma.timeRecord.findMany({
        where: { userId, deletedAt: null },
        include: { breaks: true },
        orderBy: { date: 'desc' },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Erro ao buscar registros de ponto.',
      );
    }
  }

  async findByUserAndDate(userId: string, dateStr: string) {
    try {
      const date = toUtcDate(dateStr);

      const record = await this.prisma.timeRecord.findFirst({
        where: { userId, date, deletedAt: null },
        include: { breaks: true },
      });

      if (!record) {
        throw new NotFoundException(
          'Registro de ponto não encontrado para a data informada.',
        );
      }

      return record;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Erro ao buscar registro de ponto.',
      );
    }
  }

  async findAll(admin: AuthenticatedUser) {
    try {
      return await this.prisma.timeRecord.findMany({
        where: { companyId: admin.companyId, deletedAt: null },
        include: {
          user: { select: { id: true, name: true, email: true } },
          breaks: true,
          closedBy: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Erro ao buscar registros de ponto.',
      );
    }
  }

  async findOne(admin: AuthenticatedUser, recordId: string) {
    try {
      return await this.findRecordInCompany(recordId, admin.companyId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Erro ao buscar registro de ponto.',
      );
    }
  }

  async adminCreate(admin: AuthenticatedUser, dto: AdminCreateTimeRecordDto) {
    try {
      const targetUser = await this.prisma.user.findFirst({
        where: { id: dto.userId, companyId: admin.companyId, deletedAt: null },
      });

      if (!targetUser) {
        throw new NotFoundException('Usuário não encontrado nesta empresa.');
      }

      const clockIn = new Date(dto.clockIn);
      const date = toUtcDate(clockIn);

      const existing = await this.prisma.timeRecord.findFirst({
        where: { userId: dto.userId, date, deletedAt: null },
      });

      if (existing) {
        throw new ConflictException(
          'Já existe um registro de ponto para este usuário nesta data.',
        );
      }

      let clockOut: Date | null = null;
      if (dto.clockOut) {
        clockOut = new Date(dto.clockOut);
        if (clockOut <= clockIn) {
          throw new BadRequestException('clockOut deve ser após o clockIn.');
        }
      }

      return await this.prisma.timeRecord.create({
        data: {
          userId: dto.userId,
          companyId: admin.companyId,
          date,
          clockIn,
          clockOut,
          closedById: clockOut ? admin.id : null,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          breaks: true,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Erro ao criar registro de ponto.',
      );
    }
  }

  async adminSetClockOut(
    admin: AuthenticatedUser,
    recordId: string,
    dto: AdminSetClockOutDto,
  ) {
    try {
      const record = await this.findRecordInCompany(recordId, admin.companyId);

      const clockOut = new Date(dto.clockOut);
      if (clockOut <= record.clockIn) {
        throw new BadRequestException('clockOut deve ser após o clockIn.');
      }

      return await this.prisma.timeRecord.update({
        where: { id: recordId },
        data: { clockOut, closedById: admin.id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          breaks: true,
          closedBy: { select: { id: true, name: true } },
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Erro ao registrar saída.');
    }
  }

  async adminAddBreak(
    admin: AuthenticatedUser,
    recordId: string,
    dto: AdminAddBreakDto,
  ) {
    try {
      const record = await this.findRecordInCompany(recordId, admin.companyId);

      const startedAt = new Date(dto.startedAt);
      let endedAt: Date | null = null;

      if (dto.endedAt) {
        endedAt = new Date(dto.endedAt);
        if (endedAt <= startedAt) {
          throw new BadRequestException('endedAt deve ser após o startedAt.');
        }
      }

      if (!endedAt) {
        const openBreak = await this.prisma.breakRecord.findFirst({
          where: { timeRecordId: record.id, endedAt: null },
        });
        if (openBreak) {
          throw new ConflictException(
            'Já existe uma pausa em aberto neste registro.',
          );
        }
      }

      return await this.prisma.breakRecord.create({
        data: {
          timeRecordId: record.id,
          startedAt,
          endedAt,
          registeredById: admin.id,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Erro ao adicionar pausa.');
    }
  }

  async adminEditBreak(
    admin: AuthenticatedUser,
    recordId: string,
    breakId: string,
    dto: AdminEditBreakDto,
  ) {
    try {
      await this.findRecordInCompany(recordId, admin.companyId);

      const breakRecord = await this.prisma.breakRecord.findFirst({
        where: { id: breakId, timeRecordId: recordId },
      });

      if (!breakRecord) {
        throw new NotFoundException('Pausa não encontrada neste registro.');
      }

      const startedAt = dto.startedAt
        ? new Date(dto.startedAt)
        : breakRecord.startedAt;
      const endedAt = dto.endedAt ? new Date(dto.endedAt) : breakRecord.endedAt;

      if (endedAt && endedAt <= startedAt) {
        throw new BadRequestException('endedAt deve ser após o startedAt.');
      }

      return await this.prisma.breakRecord.update({
        where: { id: breakId },
        data: { startedAt, endedAt, registeredById: admin.id },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Erro ao editar pausa.');
    }
  }

  private async findRecordInCompany(recordId: string, companyId: string) {
    const record = await this.prisma.timeRecord.findFirst({
      where: { id: recordId, companyId, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, email: true } },
        breaks: true,
        closedBy: { select: { id: true, name: true } },
      },
    });

    if (!record) {
      throw new NotFoundException('Registro de ponto não encontrado.');
    }

    return record;
  }
}
