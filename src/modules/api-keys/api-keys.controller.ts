import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service.js';
import { CreateApiKeyDTO } from './dto/create-api-key.dto.js';

@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  create(@Body() dto: CreateApiKeyDTO) {
    return this.apiKeysService.create(dto);
  }

  @Delete(':id')
  revoke(@Param('id', ParseUUIDPipe) id: string) {
    return this.apiKeysService.revoke(id);
  }

  @Get()
  findAll() {
    return this.apiKeysService.findAll();
  }
}
