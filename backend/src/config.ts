import 'dotenv/config';

export function databaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value || !/^postgres(ql)?:\/\//.test(value)) {
    throw new Error('DATABASE_URL must be configured as a PostgreSQL URL');
  }
  return value;
}

export function sessionTtl(): number {
  const value = Number(process.env.SESSION_TTL_SECONDS ?? 3600);
  if (!Number.isInteger(value) || value < 60 || value > 86400) {
    throw new Error('SESSION_TTL_SECONDS must be between 60 and 86400');
  }
  return value;
}
