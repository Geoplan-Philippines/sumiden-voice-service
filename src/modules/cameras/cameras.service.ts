import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../core/database/index.js';
import { CreateCameraDTO } from './dto/create-camera.dto.js';
import { UpdateCameraDTO } from './dto/update-camera.dto.js';

@Injectable()
export class CamerasService {
  private readonly logger = new Logger(CamerasService.name);

  constructor(private readonly db: DatabaseService) {}

  async create(data: CreateCameraDTO) {
    const cameraId = await this.generateCameraId();
    const camera = await this.db.camera.create({
      data: { ...data, cameraId },
    });
    this.logger.log(`📷 Camera created: ${camera.cameraId} [${camera.name}]`);
    return camera;
  }

  async findAll() {
    return this.db.camera.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const camera = await this.db.camera.findUnique({ where: { id } });

    if (!camera || !camera.isActive) {
      throw new NotFoundException(`Camera with ID "${id}" not found`);
    }

    return camera;
  }

  async findByCameraId(cameraId: string) {
    let camera = await this.db.camera.findUnique({ where: { cameraId } });

    if (!camera) {
      camera = await this.db.camera.findUnique({ where: { id: cameraId } });
    }

    if (!camera || !camera.isActive) {
      throw new NotFoundException(`Camera "${cameraId}" not found`);
    }

    return camera;
  }

  async update(id: string, data: UpdateCameraDTO) {
    await this.findById(id);
    const camera = await this.db.camera.update({ where: { id }, data });
    this.logger.log(`📷 Camera updated: ${camera.cameraId} [${camera.name}]`);
    return camera;
  }

  async delete(id: string) {
    await this.findById(id);
    const camera = await this.db.camera.update({
      where: { id },
      data: { isActive: false },
    });
    this.logger.log(`📷 Camera deactivated: ${camera.cameraId} [${camera.name}]`);
    return camera;
  }

  /**
   * Generates the next incremental camera ID in format CAM-0001, CAM-0002, etc.
   */
  private async generateCameraId(): Promise<string> {
    const lastCamera = await this.db.camera.findFirst({
      orderBy: { cameraId: 'desc' },
      select: { cameraId: true },
    });

    let nextNumber = 1;

    if (lastCamera) {
      const match = lastCamera.cameraId.match(/^CAM-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `CAM-${nextNumber.toString().padStart(4, '0')}`;
  }
}
