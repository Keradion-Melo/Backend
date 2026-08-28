import { IsNotEmpty, IsString, IsIn, IsNumber, IsOptional } from 'class-validator';

export class RecordPlaybackDto {
  @IsNotEmpty()
  @IsString()
  trackId: string;

  @IsNotEmpty()
  @IsIn(['jamendo', 'youtube'])
  service: 'jamendo' | 'youtube';

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  artist?: string;

  @IsOptional()
  @IsString()
  albumArt?: string;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;
}
