import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/index.js';
import { CamerasController } from './cameras.controller.js';
import { CamerasService } from './cameras.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [CamerasController],
  providers: [CamerasService],
  exports: [CamerasService],
})
export class CamerasModule {}
