import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      map((data) => ({
        statusCode: response.statusCode,
        message: 'Success',
        data,
      })),
    );
  }
}
