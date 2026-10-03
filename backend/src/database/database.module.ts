import { Global, Injectable, Module, OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import { databaseUrl } from '../config';

@Injectable()
export class DatabaseService extends Pool implements OnApplicationShutdown {
  constructor() {
    super({ connectionString: databaseUrl(), max: 10, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000, statement_timeout: 10000 });
    this.on('error', () => console.error('PostgreSQL idle connection failed'));
  }
  async onApplicationShutdown() { await this.end(); }
}

@Global()
@Module({ providers: [DatabaseService], exports: [DatabaseService] })
export class DatabaseModule {}
