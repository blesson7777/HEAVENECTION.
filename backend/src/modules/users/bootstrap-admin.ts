import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { databaseUrl } from '../../config';
import { hashPassword } from '../auth/password';
async function bootstrap() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !email.includes('@') || !password || password.length < 12) throw new Error('Configure bootstrap credentials');
  const pool = new Pool({ connectionString: databaseUrl(), connectionTimeoutMillis: 5000 });
  try {
    const result = await pool.query("INSERT INTO users (id,email,name,password_hash,role) VALUES ($1,$2,'Administrator',$3,'ADMIN') ON CONFLICT (email) DO NOTHING", [randomUUID(), email, await hashPassword(password)]);
    console.log(result.rowCount ? 'Administrator created' : 'Existing account preserved');
  } finally { await pool.end(); }
}
bootstrap().catch(() => { console.error('Admin setup failed. Check database and bootstrap configuration.'); process.exitCode = 1; });
