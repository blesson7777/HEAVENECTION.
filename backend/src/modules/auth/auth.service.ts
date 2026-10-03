import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { DatabaseService } from '../../database/database.module';
import { sessionTtl } from '../../config';
import { SessionUser } from './auth.types';
import { verifyPassword } from './password';

@Injectable()
export class AuthService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}
  private digest(token: string) { return createHash('sha256').update(token).digest('hex'); }
  async login(email: string, password: string) {
    const result = await this.db.query<SessionUser & { password_hash: string }>(
      'SELECT id, email, name, role, password_hash FROM users WHERE email = $1 AND active = true', [email.trim().toLowerCase()]);
    const user = result.rows[0];
    const valid = await verifyPassword(password, user?.password_hash ?? `${'0'.repeat(32)}:${'0'.repeat(128)}`);
    if (!user || !valid) throw new UnauthorizedException('Invalid email or password');
    const token = randomBytes(32).toString('hex');
    const expiresIn = sessionTtl();
    await this.db.query('DELETE FROM sessions WHERE expires_at <= now()');
    await this.db.query("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + $3 * interval '1 second')", [this.digest(token), user.id, expiresIn]);
    const { password_hash, ...safeUser } = user;
    return { accessToken: token, expiresIn, user: safeUser };
  }
  async authenticate(token: string): Promise<SessionUser> {
    if (!/^[a-f0-9]{64}$/.test(token)) throw new UnauthorizedException();
    const result = await this.db.query<SessionUser>(`SELECT u.id, u.email, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > now() AND u.active = true`, [this.digest(token)]);
    if (!result.rows[0]) throw new UnauthorizedException();
    return result.rows[0];
  }
  async logout(token: string) { await this.db.query('DELETE FROM sessions WHERE token_hash = $1', [this.digest(token)]); }
}
