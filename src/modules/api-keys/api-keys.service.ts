import { randomBytes, createHash } from 'node:crypto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../core/database/index.js';
import { CreateApiKeyDTO } from './dto/create-api-key.dto.js';

const API_KEY_PREFIX = 'geo_';
const KEY_BYTE_LENGTH = 32;

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateApiKeyDTO) {
    const raw = `${API_KEY_PREFIX}${randomBytes(KEY_BYTE_LENGTH).toString('hex')}`;
    const prefix = raw.slice(0, 8);
    const hash = this.hashKey(raw);

    const apiKey = await this.db.apiKey.create({
      data: {
        name: dto.name,
        prefix,
        hash,
      },
    });

    this.logger.log(`API key created: ${apiKey.id} (${prefix}...)`);

    // Return the plain key only once — it cannot be retrieved again
    return {
      id: apiKey.id,
      name: apiKey.name,
      key: raw,
      createdAt: apiKey.createdAt,
    };
  }

  async revoke(id: string) {
    const apiKey = await this.db.apiKey.findUnique({ where: { id } });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.revokedAt) {
      throw new NotFoundException('API key already revoked');
    }

    const revoked = await this.db.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`API key revoked: ${revoked.id}`);

    return {
      id: revoked.id,
      name: revoked.name,
      revokedAt: revoked.revokedAt,
    };
  }

  async findAll() {
    return this.db.apiKey.findMany({
      select: {
        id: true,
        name: true,
        prefix: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async validate(raw: string): Promise<boolean> {
    const hash = this.hashKey(raw);
    const apiKey = await this.db.apiKey.findUnique({ where: { hash } });
    return !!apiKey && !apiKey.revokedAt;
  }

  private hashKey(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }
}
