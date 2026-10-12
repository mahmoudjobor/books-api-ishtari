import {
  Global,
  Inject,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const logger = new Logger('Redis');
        const client = new Redis({
          host: config.get<string>('REDIS_HOST', '127.0.0.1'),
          port: Number(config.get('REDIS_PORT', 6379)),
          connectTimeout: 1000,
          commandTimeout: 1000, // every command gives up after 1 second
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false, // fail fast while Redis is down
          retryStrategy: (times) => Math.min(times * 200, 2000), // keep reconnecting
        });
        client.on('error', (err: Error) =>
          logger.warn(`Redis error: ${err.message}`),
        );
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  onApplicationShutdown(): void {
    this.redis.disconnect();
  }
}
