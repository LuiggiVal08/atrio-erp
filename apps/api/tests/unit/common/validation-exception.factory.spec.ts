import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { validationExceptionFactory } from '../../../src/common/validation/validation-exception.factory';

function validationError(
  property: string,
  constraints?: Record<string, string>,
  children?: ValidationError[],
): ValidationError {
  return { property, constraints, children } as ValidationError;
}

describe('validationExceptionFactory', () => {
  it('returns a 400 BadRequestException', () => {
    const exception = validationExceptionFactory([]);

    expect(exception).toBeInstanceOf(BadRequestException);
    expect(exception.getStatus()).toBe(400);
  });

  it('maps constraints to field errors', () => {
    const exception = validationExceptionFactory([
      validationError('name', {
        isNotEmpty: 'name should not be empty',
        isString: 'name must be a string',
      }),
      validationError('price', { min: 'price must not be less than 0' }),
    ]);

    const response = exception.getResponse() as {
      message: string[];
      errors: { field: string; message: string }[];
    };

    expect(response.errors).toEqual([
      { field: 'name', message: 'name should not be empty' },
      { field: 'name', message: 'name must be a string' },
      { field: 'price', message: 'price must not be less than 0' },
    ]);
    expect(response.message).toEqual([
      'name should not be empty',
      'name must be a string',
      'price must not be less than 0',
    ]);
  });

  it('flattens nested children using dot paths', () => {
    const exception = validationExceptionFactory([
      validationError('address', undefined, [
        validationError('city', { isNotEmpty: 'city should not be empty' }),
        validationError('lines', undefined, [
          validationError('0', { isString: 'lines.0 must be a string' }),
        ]),
      ]),
    ]);

    const response = exception.getResponse() as {
      errors: { field: string; message: string }[];
    };

    expect(response.errors).toEqual([
      { field: 'address.city', message: 'city should not be empty' },
      { field: 'address.lines.0', message: 'lines.0 must be a string' },
    ]);
  });

  it('ignores nodes without constraints or children', () => {
    const exception = validationExceptionFactory([
      validationError('metadata'),
      validationError('name', { isString: 'name must be a string' }),
    ]);

    const response = exception.getResponse() as {
      errors: { field: string; message: string }[];
    };

    expect(response.errors).toEqual([
      { field: 'name', message: 'name must be a string' },
    ]);
  });
});
