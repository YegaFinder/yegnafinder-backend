import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    const detailedMessage = this.getExceptionMessage(exceptionResponse, exception);

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: detailedMessage || exception.message || null,
    };

    this.logger.error(
      `HTTP Exception: ${request.method} ${request.url} - Status: ${status} - Message: ${exception.message}`,
    );

    response.status(status).json(errorResponse);
  }

  private getExceptionMessage(
    exceptionResponse: string | object,
    exception: HttpException,
  ): string | string[] | null {
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const message = (exceptionResponse as Record<string, unknown>).message;
      if (typeof message === 'string' || Array.isArray(message)) {
        return message as string | string[];
      }
    }
    return exception.message || null;
  }
}
