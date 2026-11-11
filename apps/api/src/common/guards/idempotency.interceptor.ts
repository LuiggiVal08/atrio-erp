import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ConflictException } from '@nestjs/common';
import { Observable, from, throwError, of } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { RedisService } from '@/infrastructure/redis/redis.service';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly TTL = 3600;

  constructor(private readonly redis: RedisService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const key = request.headers['idempotency-key'];
    if (!key) return next.handle();

    return from(this.redis.get(`idemp:${key}`)).pipe(
      switchMap((cached) => {
        if (cached === 'pending') {
          return throwError(() => new ConflictException('Request is already being processed'));
        }
        if (cached) {
          return of(JSON.parse(cached));
        }
        return from(this.redis.set(`idemp:${key}`, 'pending', 'EX', this.TTL)).pipe(
          switchMap(() =>
            next.handle().pipe(
              tap(async (response) => {
                await this.redis.set(`idemp:${key}`, JSON.stringify(response), 'EX', this.TTL);
              }),
              catchError(async (err) => {
                await this.redis.del(`idemp:${key}`);
                throw err;
              }),
            ),
          ),
        );
      }),
    );
  }
}
