import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class ReorderQueueDto {
  @IsArray()
  @IsNumber({}, { each: true })
  order: number[];

  @IsOptional()
  @IsString()
  sessionId?: string;
}
