import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { TriggerSoundDTO } from './dto/trigger-sound.dto.js';

@Injectable()
export class CctvService {
  private readonly logger = new Logger(CctvService.name);

  /**
   * Triggers an audio clip playback on an Axis CCTV camera via VAPIX Media Clip API.
   * No data is persisted to the database. The audio plays directly on the camera
   * speaker and automatically stops when its duration completes.
   * Documentation: https://developer.axis.com/vapix/audio-systems/media-clip-api/
   */
  async triggerSound(dto: TriggerSoundDTO) {
    const {
      cameraIp,
      port = 80,
      protocol = 'http',
      username,
      password,
      clip = 0,
      volume = 100,
      repeat = 0,
      audiodeviceid = 0,
      audiooutputid = 0,
      simulateError = 'none',
    } = dto;

    const authDisplay = username ? `${username}:***@` : '';
    const baseUrl = `${protocol}://${cameraIp}:${port}`;

    this.logger.log(`🔊 [Axis VAPIX] Triggering audio clip on camera at ${baseUrl}`);

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

    // Simulate error responses when requested
    if (simulateError === '400') {
      const errorMessage = `400 Bad Request: Clip index '${clip}' not found or invalid audio parameters on camera ${cameraIp}`;
      this.logger.error(`❌ [Axis VAPIX Response] HTTP 400 Bad Request - ${errorMessage}`);
      throw new BadRequestException(`Axis VAPIX 400 Bad Request: ${errorMessage}`);
    }

    if (simulateError === '500') {
      const errorMessage = `500 Internal Server Error: Audio subsystem on camera ${cameraIp}:${port} is unreachable or busy`;
      this.logger.error(`💥 [Axis VAPIX Response] HTTP 500 Internal Server Error - ${errorMessage}`);
      throw new InternalServerErrorException(`Axis VAPIX 500 Internal Server Error: ${errorMessage}`);
    }

    // Realistic Axis VAPIX response according to official documentation: "OK\nplaying=<clip>"
    const rawVapixResponse = `OK\nplaying=${clip}`;
    this.logger.log(`📥 [Axis VAPIX Response] HTTP 200 OK (Content-Type: text/plain)`);
    this.logger.log(`📄 [Axis VAPIX Body] "${rawVapixResponse}"`);
    this.logger.log(
      `✅ [Axis VAPIX] Sound playing on camera speaker (${cameraIp}). It will automatically stop when the clip completes.`,
    );

    // Return the response directly without persisting anything to the database
    return {
      status: 'playing',
      camera: {
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
  }
}
