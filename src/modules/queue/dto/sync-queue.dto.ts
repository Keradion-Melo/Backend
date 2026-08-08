import { IsArray, ValidateNested, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { AddQueueTrackDto } from './add-track.dto';

export class SyncQueueDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddQueueTrackDto)
  tracks: AddQueueTrackDto[];

  @IsOptional()
  @IsString()
  sessionId?: string;
}
