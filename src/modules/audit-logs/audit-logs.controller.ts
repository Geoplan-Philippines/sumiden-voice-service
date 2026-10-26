import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service.js';
import { GetAuditLogsDTO } from './dto/get-audit-logs.dto.js';

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  findAll(@Query() query: GetAuditLogsDTO) {
    return this.auditLogsService.findAll(query);
  }
}
