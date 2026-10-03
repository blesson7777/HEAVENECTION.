import { Pool } from 'pg';
import { databaseUrl } from '../config';

async function migrate() {
  const pool = new Pool({ connectionString: databaseUrl(), connectionTimeoutMillis: 5000 });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(728164)');
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
    const applied = await client.query('SELECT version FROM schema_migrations WHERE version = 1');
    if (!applied.rowCount) {
      await client.query(`
        CREATE TABLE users (
          id uuid PRIMARY KEY,
          email text NOT NULL UNIQUE CHECK (email = lower(email)),
          name text NOT NULL,
          password_hash text NOT NULL,
          role text NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'STAFF')),
          active boolean NOT NULL DEFAULT true,
          created_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE sessions (
          token_hash text PRIMARY KEY,
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at timestamptz NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX sessions_user_idx ON sessions(user_id);
        CREATE INDEX sessions_expiry_idx ON sessions(expires_at);
        INSERT INTO schema_migrations (version) VALUES (1);
      `);
    }
    await client.query('COMMIT');
    console.log('Database migrations are up to date');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); await pool.end(); }
}
migrate().catch(() => { console.error('Migration failed. Check database configuration and connectivity.'); process.exitCode = 1; });
