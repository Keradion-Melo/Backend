import { IsNumber, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateCurrentDto {
  @IsOptional()
  @IsNumber()
  currentIndex?: number;

  @IsOptional()
  @IsEnum(['playing', 'paused', 'stopped'])
  status?: 'playing' | 'paused' | 'stopped';

  @IsOptional()
  @IsNumber()
  currentTime?: number;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
