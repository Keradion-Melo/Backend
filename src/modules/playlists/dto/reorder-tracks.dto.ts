import { IsNumber, Min } from 'class-validator';

export class ReorderTracksDto {
  @IsNumber()
  @Min(0)
  oldIndex: number;

  @IsNumber()
  @Min(0)
  newIndex: number;
}
