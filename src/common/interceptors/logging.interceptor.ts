import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('RequestLog');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<Response>();

    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = request.user?.id || null;

    return next.handle().pipe(
      tap({
        next: () => {
          this.logRequest(
            method,
            url,
            response.statusCode,
            Date.now() - startTime,
            userId,
            ip,
            userAgent,
          );
        },
        error: (error) => {
          const statusCode = error?.status || error?.statusCode || 500;
          this.logRequest(
            method,
            url,
            statusCode,
            Date.now() - startTime,
            userId,
            ip,
            userAgent,
            error.message,
          );
        },
      }),
    );
  }

  private logRequest(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number,
    userId: string | null,
    ip: string,
    userAgent: string,
    errorMessage?: string,
  ) {
    const logData = {
      timestamp: new Date().toISOString(),
      method,
      route: this.sanitizeRoute(route),
      statusCode,
      durationMs,
      userId: userId || undefined,
      ip: this.sanitizeIP(ip),
      userAgent: this.truncateUserAgent(userAgent),
      ...(errorMessage && { error: errorMessage }),
    };

    // Use structured logging for better parsing by log aggregation services
    const logMessage = `REQUEST_LOG ${JSON.stringify(logData)}`;

    if (statusCode >= 500) {
      this.logger.error(logMessage);
    } else if (statusCode >= 400) {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }
  }

  private sanitizeRoute(route: string): string {
    // Remove query parameters for cleaner logging and to avoid logging sensitive data
    const urlParts = route.split('?');
    let cleanRoute = urlParts[0];

    // Replace UUIDs with placeholder for better log aggregation
    cleanRoute = cleanRoute.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ':id',
    );

    return cleanRoute;
  }

  private sanitizeIP(ip: string): string {
    // Handle various IP formats (IPv4, IPv6, forwarded IPs)
    if (ip.includes('::ffff:')) {
      return ip.replace('::ffff:', '');
    }
    
    // For load balancer forwarded IPs, take the first one
    if (ip.includes(',')) {
      return ip.split(',')[0].trim();
    }

    return ip;
  }

  private truncateUserAgent(userAgent: string): string {
    // Truncate user agent to avoid extremely long log entries
    return userAgent.length > 200 ? userAgent.substring(0, 200) + '...' : userAgent;
  }
}