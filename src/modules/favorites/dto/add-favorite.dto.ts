import { IsString, IsEnum, IsOptional } from 'class-validator';

export class AddFavoriteDto {
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
}
