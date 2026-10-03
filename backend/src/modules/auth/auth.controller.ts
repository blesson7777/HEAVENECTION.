import { Body, Controller, Get, HttpCode, Inject, Post, Req } from '@nestjs/common';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthRequest, Public } from './auth.types';
export class LoginDto {
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @MinLength(1) @MaxLength(128) password!: string;
}
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private auth: AuthService) {}
  @Public() @Post('login') @HttpCode(200) @Throttle({ default: { limit: 10, ttl: 60000 } })
  login(@Body() body: LoginDto) { return this.auth.login(body.email, body.password); }
  @Get('me') me(@Req() request: AuthRequest) { return request.user; }
  @Post('logout') @HttpCode(204)
  async logout(@Req() request: AuthRequest) { await this.auth.logout(request.sessionToken); }
}
