import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { PrismaService } from '../database/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCompanyDto) {
    try {
      if (dto.cnpj) {
        const existing = await this.prisma.company.findUnique({
          where: { cnpj: dto.cnpj },
        });

        if (existing) {
          throw new ConflictException('CNPJ já cadastrado.');
        }
      }

      return await this.prisma.company.create({ data: dto });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Erro ao criar empresa.');
    }
  }

  async findAll() {
    try {
      return await this.prisma.company.findMany({
        where: { deletedAt: null },
        include: {
          _count: { select: { users: true } },
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Erro ao buscar empresas.');
    }
  }

  async findOne(id: string) {
    try {
      const company = await this.prisma.company.findFirst({
        where: { id, deletedAt: null },
        include: {
          _count: {
            select: { users: { where: { deletedAt: null } } },
          },
        },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada.');
      }

      return company;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Erro ao buscar empresa.');
    }
  }

  async update(id: string, dto: UpdateCompanyDto, admin: AuthenticatedUser) {
    try {
      if (admin.companyId !== id) {
        throw new ForbiddenException(
          'Você só pode editar a sua própria empresa.',
        );
      }

      await this.findOne(id);

      return await this.prisma.company.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Erro ao atualizar empresa.');
    }
  }

  async remove(id: string, admin: AuthenticatedUser): Promise<void> {
    try {
      if (admin.companyId !== id) {
        throw new ForbiddenException(
          'Você só pode remover a sua própria empresa.',
        );
      }

      await this.findOne(id);
      await this.prisma.company.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Erro ao remover empresa.');
    }
  }
}
