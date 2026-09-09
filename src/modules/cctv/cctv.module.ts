import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import { CamerasModule } from '../cameras/cameras.module.js';
import { CctvController } from './cctv.controller.js';
import { CctvService } from './cctv.service.js';

@Module({
  imports: [AuditLogsModule, CamerasModule],
  controllers: [CctvController],
  providers: [CctvService],
  exports: [CctvService],
})
export class CctvModule {}
