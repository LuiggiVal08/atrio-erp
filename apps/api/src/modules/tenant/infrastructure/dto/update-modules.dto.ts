import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class UpdateModulesDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(0)
  enabledModules: string[];
}
