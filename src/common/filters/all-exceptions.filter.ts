import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

const DEFAULT_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
};

interface ErrorBody {
  code?: string;
  message?: string | string[];
  details?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    let status = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = DEFAULT_CODES[status] ?? 'HTTP_ERROR';
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else {
        const b = body as ErrorBody;
        code = b.code ?? code;
        message = Array.isArray(b.message)
          ? b.message.join('; ')
          : (b.message ?? message);
        details = b.details;
      }
    } else {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    res.status(status).json({
      success: false,
      error: { code, message, ...(details !== undefined ? { details } : {}) },
    });
  }
}
