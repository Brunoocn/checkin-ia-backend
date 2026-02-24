import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { DatabaseModule } from './modules/database/database.module';
import { TimeRecordsModule } from './modules/time-records/time-records.module';
import { UsersModule } from './modules/users/users.module';
import { WorkSchedulesModule } from './modules/work-schedules/work-schedules.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    WorkSchedulesModule,
    TimeRecordsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
