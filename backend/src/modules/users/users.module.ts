import { Body, Controller, Inject, Module, Post } from '@nestjs/common';
import { IsEmail, IsEnum, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Role, Roles } from '../auth/auth.types';
import { UsersService } from './users.service';
export class CreateUserDto {
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @MinLength(1) @MaxLength(100) @Matches(/\S/) name!: string;
  @IsString() @MinLength(12) @MaxLength(128) password!: string;
  @IsEnum(Role) role!: Role;
}
@Controller('users')
@Roles(Role.ADMIN)
class UsersController {
  constructor(@Inject(UsersService) private users: UsersService) {}
  @Post() create(@Body() body: CreateUserDto) { return this.users.create(body); }
}
@Module({ controllers: [UsersController], providers: [UsersService] })
export class UsersModule {}
