import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../../database/database.module';
import { Role, SessionUser } from '../auth/auth.types';
import { hashPassword } from '../auth/password';
@Injectable()
export class UsersService {
  constructor(@Inject(DatabaseService) private db: DatabaseService) {}
  async create(input: { email: string; name: string; password: string; role: Role }) {
    try {
      const result = await this.db.query<SessionUser>('INSERT INTO users (id,email,name,password_hash,role) VALUES ($1,$2,$3,$4,$5) RETURNING id,email,name,role', [randomUUID(), input.email.trim().toLowerCase(), input.name.trim(), await hashPassword(input.password), input.role]);
      return result.rows[0];
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw new ConflictException('Email already exists');
      throw error;
    }
  }
}
