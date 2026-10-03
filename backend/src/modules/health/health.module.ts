import { Controller, Get, Inject, Module, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.module';
import { Public } from '../auth/auth.types';
@Controller('health')
@Public()
class HealthController {
  constructor(@Inject(DatabaseService) private db: DatabaseService) {}
  @Get() live() { return { status: 'ok' }; }
  @Get('ready') async ready() {
    try { await this.db.query('SELECT 1 FROM schema_migrations WHERE version = 1'); return { status: 'ok', database: 'up' }; }
    catch { throw new ServiceUnavailableException('Database unavailable or migrations missing'); }
  }
}
@Module({ controllers: [HealthController] })
export class HealthModule {}
