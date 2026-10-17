import { Module } from '@nestjs/common';
import { WhitelabelContractsService } from './whitelabel-contracts.service';
import { WhitelabelPayeesService } from './whitelabel-payees.service';
import { WhitelabelContractsController } from './whitelabel-contracts.controller';
import { WhitelabelPayeesController } from './whitelabel-payees.controller';
import { PrismaModule } from 'src/lib/prisma/prisma.module';
import { WhitelabelSessionModule } from '../session/whitelabel-session.module';

@Module({
  imports: [PrismaModule, WhitelabelSessionModule],
  controllers: [WhitelabelPayeesController, WhitelabelContractsController],
  providers: [WhitelabelContractsService, WhitelabelPayeesService],
  exports: [WhitelabelContractsService, WhitelabelPayeesService],
})
export class WhitelabelContractsModule {}
