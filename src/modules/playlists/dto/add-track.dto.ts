import { IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';

export class AddTrackDto {
  @IsString()
  trackId: string;

  @IsEnum(['jamendo', 'youtube'])
  service: 'jamendo' | 'youtube';

  @IsString()
  title: string;

  @IsString()
  artist: string;

  @IsOptional()
  @IsString()
  albumArt?: string;

  @IsNumber()
  duration: number;
}
