import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { DatabaseService } from '../../core/database/index.js';
import { GetAuditLogsDTO } from './dto/get-audit-logs.dto.js';

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(private readonly db: DatabaseService) {}

  async create(data: Prisma.AuditLogCreateInput) {
    const log = await this.db.auditLog.create({ data });
    this.logger.log(`📝 Audit log created: ${log.id} [${log.action}] ${log.status}`);
    return log;
  }

  async findAll(query: GetAuditLogsDTO) {
    const { page = 1, limit = 20, action, cameraId, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      ...(action && { action }),
      ...(cameraId && { cameraId }),
      ...(status && {
        status:
          status.toLowerCase() === 'failed' || status.toLowerCase() === 'error'
            ? { in: ['failed', 'error'] }
            : status,
      }),
    };

    const [data, total] = await Promise.all([
      this.db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.db.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
