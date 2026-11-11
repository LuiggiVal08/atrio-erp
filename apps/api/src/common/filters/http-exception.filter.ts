import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = this.resolveStatusAndMessage(exception);

    this.logger.error(
      `[${request.method}] ${request.url} -> ${status}: ${exception instanceof Error ? exception.message : exception}`
    );

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(message) ? message : [message],
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private resolveStatusAndMessage(exception: unknown): { status: number; message: string | string[] } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message = typeof res === 'string' ? res : (res as any).message ?? 'Http Error';
      return { status, message };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaKnownError(exception);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return { status: HttpStatus.BAD_REQUEST, message: 'Invalid request data' };
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return { status: HttpStatus.SERVICE_UNAVAILABLE, message: 'Service temporarily unavailable' };
    }

    if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Unexpected database error' };
    }

    if (exception instanceof Prisma.PrismaClientRustPanicError) {
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' };
    }

    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' };
  }

  private handlePrismaKnownError(error: Prisma.PrismaClientKnownRequestError): { status: number; message: string } {
    switch (error.code) {
      case 'P2002':
        return { status: HttpStatus.CONFLICT, message: 'A record with this value already exists' };
      case 'P2025':
        return { status: HttpStatus.NOT_FOUND, message: 'Record not found' };
      case 'P2003':
        return { status: HttpStatus.CONFLICT, message: 'Referenced record does not exist' };
      case 'P2023':
        return { status: HttpStatus.BAD_REQUEST, message: 'Invalid ID format' };
      default:
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Database error' };
    }
  }
}
