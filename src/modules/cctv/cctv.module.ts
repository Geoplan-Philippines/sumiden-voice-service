import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import { CctvController } from './cctv.controller.js';
import { CctvService } from './cctv.service.js';

@Module({
  imports: [AuditLogsModule],
  controllers: [CctvController],
  providers: [CctvService],
  exports: [CctvService],
})
export class CctvModule {}
