import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPool } from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';

export const MYSQL_POOL = Symbol('MYSQL_POOL');

@Global()
@Module({
  providers: [
    {
      provide: MYSQL_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Pool =>
        createPool({
          host: config.get<string>('DB_HOST', '127.0.0.1'),
          port: Number(config.get('DB_PORT', 3306)),
          user: config.getOrThrow<string>('DB_USER'),
          password: config.get<string>('DB_PASSWORD', ''),
          database: config.getOrThrow<string>('DB_NAME'),
          waitForConnections: true,
          connectionLimit: 10,
        }),
    },
  ],
  exports: [MYSQL_POOL],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
