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
} from '@nestjs/common';
import { CamerasService } from './cameras.service.js';
import { CreateCameraDTO } from './dto/create-camera.dto.js';
import { UpdateCameraDTO } from './dto/update-camera.dto.js';

/**
 * Removes the camera password before sending a record to API clients.
 * The password is still stored and used internally for VAPIX authentication.
 */
function withoutPassword<T extends { password?: string | null }>(camera: T): Omit<T, 'password'> {
  const { password: _password, ...rest } = camera;
  return rest;
}

@Controller('cameras')
export class CamerasController {
  constructor(private readonly camerasService: CamerasService) {}

  @Post()
  async create(@Body() dto: CreateCameraDTO) {
    return withoutPassword(await this.camerasService.create(dto));
  }

  @Get()
  async findAll() {
    const cameras = await this.camerasService.findAll();
    return cameras.map(withoutPassword);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return withoutPassword(await this.camerasService.findById(id));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCameraDTO) {
    return withoutPassword(await this.camerasService.update(id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    return withoutPassword(await this.camerasService.delete(id));
  }
}
