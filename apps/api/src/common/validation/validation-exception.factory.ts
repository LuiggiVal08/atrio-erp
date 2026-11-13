import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export interface FieldValidationError {
  field: string;
  message: string;
}

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): FieldValidationError[] {
  return errors.flatMap((error) => {
    const field = parentPath ? `${parentPath}.${error.property}` : error.property;
    const own = Object.values(error.constraints ?? {}).map((message) => ({
      field,
      message,
    }));
    const children = error.children?.length
      ? flattenValidationErrors(error.children, field)
      : [];

    return [...own, ...children];
  });
}

export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  const fields = flattenValidationErrors(errors);

  return new BadRequestException({
    message: fields.map(({ message }) => message),
    errors: fields,
  });
}
