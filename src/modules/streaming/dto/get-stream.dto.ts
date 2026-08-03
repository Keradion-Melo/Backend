import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class GetStreamDto {
  @IsNotEmpty()
  @IsString()
  trackId: string;

  @IsNotEmpty()
  @IsIn(['jamendo', 'youtube'])
  service: 'jamendo' | 'youtube';
}
