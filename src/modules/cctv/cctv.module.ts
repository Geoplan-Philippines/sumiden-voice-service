import { Module } from '@nestjs/common';
import { CctvController } from './cctv.controller.js';
import { CctvService } from './cctv.service.js';

@Module({
  controllers: [CctvController],
  providers: [CctvService],
  exports: [CctvService],
})
export class CctvModule {}
