import { BadRequestException, ValidationPipe } from '@nestjs/common';

export const createValidationPipe = (): ValidationPipe =>
  new ValidationPipe({
    transform: true,
    whitelist: true,
    exceptionFactory: (errors) =>
      new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: errors.flatMap((e) => Object.values(e.constraints ?? {})),
      }),
  });
