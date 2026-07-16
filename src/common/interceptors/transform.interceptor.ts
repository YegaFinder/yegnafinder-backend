import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: unknown) => {
        const payload =
          data !== null && typeof data === 'object'
            ? (data as { message?: string; data?: T })
            : undefined;

        return {
          success: true,
          message: payload?.message ?? 'Operation successful',
          data: payload?.data ?? (data as T | undefined),
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
