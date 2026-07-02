import { IsString, IsIn } from 'class-validator';

export class UpdateLocaleDto {
  @IsString()
  @IsIn(['es', 'en'])
  locale!: string;
}
