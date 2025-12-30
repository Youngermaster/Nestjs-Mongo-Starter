import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ method: string; url: string; user?: { email: string } }>();
    const { method, url, user } = request;
    const now = Date.now();

    const userInfo = user ? `User: ${user.email}` : 'Anonymous';

    this.logger.log(`Incoming Request: ${method} ${url} - ${userInfo}`);

    return next.handle().pipe(
      tap(() => {
        const response = context
          .switchToHttp()
          .getResponse<{ statusCode: number }>();
        const delay = Date.now() - now;

        this.logger.log(
          `Outgoing Response: ${method} ${url} - Status: ${response.statusCode} - ${delay}ms`,
        );
      }),
    );
  }
}
