import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../api-keys/api-key.guard.js';
import { AuditLogsService } from './audit-logs.service.js';
import { GetAuditLogsDTO } from './dto/get-audit-logs.dto.js';

@Controller('audit-logs')
@UseGuards(ApiKeyGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  findAll(@Query() query: GetAuditLogsDTO) {
    return this.auditLogsService.findAll(query);
  }
}
