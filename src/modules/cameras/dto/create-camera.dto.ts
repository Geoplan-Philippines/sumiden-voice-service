import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateCameraDTO {
  /** Human-readable name for the camera (e.g. "Front Gate Camera") */
  @IsString()
  @IsNotEmpty()
  name: string;

  /** IP address or hostname of the Axis CCTV camera (e.g. 192.168.1.100) */
  @IsString()
  @IsNotEmpty()
  cameraIp: string;

  /** Port of the camera's web server (default 80) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  /** Protocol to connect to the camera (http or https, default http) */
  @IsOptional()
  @IsEnum(['http', 'https'])
  protocol?: 'http' | 'https';

  /** Username for camera VAPIX authentication (optional) */
  @IsOptional()
  @IsString()
  username?: string;

  /** Password for camera VAPIX authentication (optional) */
  @IsOptional()
  @IsString()
  password?: string;

  /** The media clip number to play (e.g. 0, 1, 2) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  clip?: number;

  /** Volume percentage (0-1000, 100 = default volume, 0 = mute) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  volume?: number;

  /** Number of times to repeat (-1 = forever, 0 = play once, default 0) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-1)
  repeat?: number;

  /** Audio device index on the camera (default 0) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  audiodeviceid?: number;

  /** Audio output index on the device (default 0) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  audiooutputid?: number;
}
