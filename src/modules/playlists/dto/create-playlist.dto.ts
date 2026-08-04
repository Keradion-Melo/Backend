import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class CreatePlaylistDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  isCollaborative?: boolean;
}
