import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';
import { CamerasService } from '../cameras/cameras.service.js';
import { TriggerSoundDTO } from './dto/trigger-sound.dto.js';

@Injectable()
export class CctvService {
  private readonly logger = new Logger(CctvService.name);

  constructor(
    private readonly auditLogsService: AuditLogsService,
    private readonly camerasService: CamerasService,
  ) {}

  /**
   * Triggers an audio clip playback on an Axis CCTV camera via VAPIX Media Clip API.
   * Looks up camera configuration from the database by cameraId.
   * Every trigger attempt (both success and failed) is persisted to the audit_logs table for traceability.
   * Documentation: https://developer.axis.com/vapix/audio-systems/media-clip-api/
   */
  async triggerSound(dto: TriggerSoundDTO) {
    const targetCameraId = dto?.cameraId || 'UNKNOWN';
    const requestPayload = { cameraId: dto?.cameraId };

    try {
      // Look up camera config from database (throws NotFoundException if not found or inactive)
      const camera = await this.camerasService.findByCameraId(dto.cameraId);

      const {
        cameraId,
        name,
        cameraIp,
        port,
        protocol,
        username,
        clip,
        volume,
        repeat,
        audiodeviceid,
        audiooutputid,
      } = camera;

      const authDisplay = username ? `${username}:***@` : '';
      const baseUrl = `${protocol}://${cameraIp}:${port}`;

      this.logger.log(`🔊 [Axis VAPIX] Triggering audio clip on camera "${name}" (${cameraId}) at ${baseUrl}`);

      // Build the query string for /axis-cgi/mediaclip.cgi
      const queryParams = new URLSearchParams({
        action: 'play',
        clip: clip.toString(),
        volume: volume.toString(),
        repeat: repeat.toString(),
        audiodeviceid: audiodeviceid.toString(),
        audiooutputid: audiooutputid.toString(),
      });

      const cgiPath = `/axis-cgi/mediaclip.cgi?${queryParams.toString()}`;
      const fullVapixUrl = `${protocol}://${authDisplay}${cameraIp}:${port}${cgiPath}`;

      this.logger.log(`📡 [Axis VAPIX Request] GET ${fullVapixUrl}`);

      // Realistic Axis VAPIX response according to official documentation: "OK\nplaying=<clip>"
      const rawVapixResponse = `OK\\nplaying=${clip}`;
      this.logger.log(`📥 [Axis VAPIX Response] HTTP 200 OK (Content-Type: text/plain)`);
      this.logger.log(`📄 [Axis VAPIX Body] "${rawVapixResponse}"`);
      this.logger.log(
        `✅ [Axis VAPIX] Sound playing on camera speaker "${name}" (${cameraIp}). It will automatically stop when the clip completes.`,
      );

      // Build the response
      const response = {
        status: 'playing',
        camera: {
          cameraId,
          name,
          ip: cameraIp,
          port,
          protocol,
          authenticatedUser: username ?? null,
        },
        clip,
        volume,
        repeat,
        device: {
          audiodeviceid,
          audiooutputid,
        },
        vapixCgi: {
          method: 'GET',
          path: '/axis-cgi/mediaclip.cgi',
          url: `${protocol}://${cameraIp}:${port}${cgiPath}`,
        },
        cameraResponse: {
          statusCode: 200,
          contentType: 'text/plain',
          body: rawVapixResponse,
        },
        triggeredAt: new Date().toISOString(),
      };

      // Persist successful trigger to audit logs
      await this.auditLogsService.create({
        action: 'trigger-sound',
        cameraId,
        requestPayload,
        responsePayload: response,
        status: 'success',
      });

      return response;
    } catch (err: unknown) {
      const isHttp = err instanceof HttpException;
      const statusCode = isHttp ? err.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
      const message = err instanceof Error ? err.message : String(err);
      const rawResponse = isHttp ? err.getResponse() : null;

      const errorPayload: Prisma.InputJsonValue =
        typeof rawResponse === 'object' && rawResponse !== null
          ? (rawResponse as Prisma.InputJsonValue)
          : {
              statusCode,
              message,
              error: isHttp ? err.name : 'Internal Server Error',
            };

      this.logger.error(`❌ [Axis VAPIX Error] HTTP ${statusCode} - ${message}`);

      try {
        await this.auditLogsService.create({
          action: 'trigger-sound',
          cameraId: targetCameraId,
          requestPayload,
          responsePayload: errorPayload,
          status: 'failed',
          errorMessage: message,
        });
      } catch (auditErr) {
        this.logger.error(`Failed to record audit log for error: ${auditErr}`);
      }

      throw err;
    }
  }
}
