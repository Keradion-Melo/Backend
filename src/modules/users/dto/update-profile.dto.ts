import { IsOptional, IsString, IsEnum, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class UpdatePreferencesDto {
  @IsOptional()
  @IsEnum(['jamendo', 'youtube'])
  defaultService?: 'jamendo' | 'youtube';

  @IsOptional()
  @IsEnum(['dark', 'light'])
  theme?: 'dark' | 'light';

  @IsOptional()
  @IsBoolean()
  autoplay?: boolean;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  quality?: 'low' | 'medium' | 'high';
}

class UpdateProfileSubDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProfileSubDto)
  profile?: UpdateProfileSubDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePreferencesDto)
  preferences?: UpdatePreferencesDto;
}
