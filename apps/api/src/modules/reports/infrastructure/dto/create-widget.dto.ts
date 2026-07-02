import { IsString, IsObject, IsInt, Min } from 'class-validator';

export class CreateWidgetDto {
  @IsString()
  type!: string;

  @IsObject()
  config!: Record<string, any>;

  @IsInt()
  @Min(0)
  positionX!: number;

  @IsInt()
  @Min(0)
  positionY!: number;

  @IsInt()
  @Min(1)
  width!: number;

  @IsInt()
  @Min(1)
  height!: number;
}
