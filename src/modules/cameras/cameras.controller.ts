import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from '../api-keys/api-key.guard.js';
import { CamerasService } from './cameras.service.js';
import { CreateCameraDTO } from './dto/create-camera.dto.js';
import { UpdateCameraDTO } from './dto/update-camera.dto.js';

@Controller('cameras')
export class CamerasController {
  constructor(private readonly camerasService: CamerasService) {}

  @Post()
  create(@Body() dto: CreateCameraDTO) {
    return this.camerasService.create(dto);
  }

  @Get()
  @UseGuards(ApiKeyGuard)
  findAll() {
    return this.camerasService.findAll();
  }

  @Get(':id')
  @UseGuards(ApiKeyGuard)
  findById(@Param('id') id: string) {
    return this.camerasService.findById(id);
  }

  @Patch(':id')
  @UseGuards(ApiKeyGuard)
  update(@Param('id') id: string, @Body() dto: UpdateCameraDTO) {
    return this.camerasService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  delete(@Param('id') id: string) {
    return this.camerasService.delete(id);
  }
}
