import { IsNotEmpty, IsString } from 'class-validator';

export class TriggerSoundDTO {
  /** The ID of the camera to trigger sound on */
  @IsString()
  @IsNotEmpty()
  cameraId: string;
}
