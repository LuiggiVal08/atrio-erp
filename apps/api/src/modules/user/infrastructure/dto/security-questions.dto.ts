import { ArrayMaxSize, ArrayMinSize, IsInt, IsString, Min, Max, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SecurityQuestionAnswerDto {
  @IsInt()
  @Min(1)
  @Max(3)
  position: number;

  @IsString()
  @MinLength(3)
  question: string;

  @IsString()
  @MinLength(2)
  answer: string;
}

export class UpdateSecurityQuestionsDto {
  @ValidateNested({ each: true })
  @Type(() => SecurityQuestionAnswerDto)
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  answers: SecurityQuestionAnswerDto[];
}
