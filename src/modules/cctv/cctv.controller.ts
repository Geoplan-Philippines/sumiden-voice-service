import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CctvService } from './cctv.service.js';
import { TriggerSoundDTO } from './dto/trigger-sound.dto.js';

@Controller('cctv')
export class CctvController {
  constructor(private readonly cctvService: CctvService) {}

  @Post('trigger-sound')
  @HttpCode(HttpStatus.OK)
  triggerSound(@Body() dto: TriggerSoundDTO) {
    return this.cctvService.triggerSound(dto);
  }
}
