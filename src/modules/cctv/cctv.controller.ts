import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../api-keys/api-key.guard.js';
import { CctvService } from './cctv.service.js';
import { TriggerSoundDTO } from './dto/trigger-sound.dto.js';

@Controller('cctv')
@UseGuards(ApiKeyGuard)
export class CctvController {
  constructor(private readonly cctvService: CctvService) {}

  @Post('trigger-sound')
  @HttpCode(HttpStatus.OK)
  triggerSound(@Body() dto: TriggerSoundDTO) {
    return this.cctvService.triggerSound(dto);
  }
}
