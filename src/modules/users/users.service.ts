import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto, admin: AuthenticatedUser) {
    try {
      if (dto.companyId && dto.companyId !== admin.companyId) {
        throw new ForbiddenException(
          'Você só pode criar usuários para a sua própria empresa.',
        );
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictException('E-mail já está em uso.');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      return await this.prisma.user.create({
        data: {
          ...dto,
          password: hashedPassword,
          companyId: admin.companyId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          companyId: true,
          createdAt: true,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Erro ao criar usuário.');
    }
  }

  async findAll(admin: AuthenticatedUser) {
    try {
      return await this.prisma.user.findMany({
        where: { companyId: admin.companyId, deletedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          companyId: true,
          company: { select: { id: true, name: true } },
          createdAt: true,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Erro ao buscar usuários.');
    }
  }

  async findOne(id: string, admin: AuthenticatedUser) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { id, companyId: admin.companyId, deletedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          companyId: true,
          company: { select: { id: true, name: true } },
          createdAt: true,
        },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado.');
      }

      return user;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Erro ao buscar usuário.');
    }
  }

  async update(id: string, dto: UpdateUserDto, admin: AuthenticatedUser) {
    try {
      await this.findOne(id, admin);

      if (dto.password) {
        dto.password = await bcrypt.hash(dto.password, 10);
      }

      return await this.prisma.user.update({
        where: { id },
        data: dto,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          companyId: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Erro ao atualizar usuário.');
    }
  }

  async remove(id: string, admin: AuthenticatedUser): Promise<void> {
    try {
      await this.findOne(id, admin);
      await this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Erro ao remover usuário.');
    }
  }
}
