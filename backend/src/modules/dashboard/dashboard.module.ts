import { Controller, Get, Module, Req } from '@nestjs/common';
import { AuthRequest, Role, Roles } from '../auth/auth.types';
@Controller('dashboard')
class DashboardController {
  @Get('admin') @Roles(Role.ADMIN)
  admin(@Req() request: AuthRequest) { return { user: request.user, dashboard: 'admin' }; }
  @Get('manager') @Roles(Role.ADMIN, Role.MANAGER)
  manager(@Req() request: AuthRequest) { return { user: request.user, dashboard: 'manager' }; }
}
@Module({ controllers: [DashboardController] })
export class DashboardModule {}
