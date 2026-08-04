import { IsOptional, IsString, IsBoolean, MaxLength } from 'class-validator';

export class UpdatePlaylistDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  coverArt?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  isCollaborative?: boolean;
}
