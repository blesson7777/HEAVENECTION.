import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { Pool } from 'pg';
import { hashPassword } from '../src/modules/auth/password';

const base = process.env.TEST_API_URL ?? 'http://127.0.0.1:4000/api/v1';
const web = process.env.TEST_WEB_URL ?? 'http://127.0.0.1:3100';

test('role boundaries, validation, session expiry/revocation, and web cookies', async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const ids: string[] = [];
  const password = randomBytes(24).toString('hex');
  const accounts: Record<string, { email: string; token: string }> = {};
  async function request(path: string, token?: string, body?: unknown) {
    return fetch(`${base}${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10000) });
  }
  try {
    assert.equal((await request('/health/ready')).status, 200);
    assert.equal((await request('/dashboard/admin')).status, 401);
    for (const role of ['ADMIN', 'MANAGER', 'STAFF']) {
      const id = randomUUID(); ids.push(id);
      const email = `${id}@test.invalid`;
      await pool.query('INSERT INTO users (id,email,name,password_hash,role) VALUES ($1,$2,$3,$4,$5)', [id, email, `Test ${role}`, await hashPassword(password), role]);
      const response = await request('/auth/login', undefined, { email, password });
      assert.equal(response.status, 200);
      const body = await response.json() as { accessToken: string; user: Record<string, unknown> };
      assert.equal(body.user.role, role);
      assert.equal('password_hash' in body.user, false);
      accounts[role] = { email, token: body.accessToken };
    }
    assert.equal((await request('/dashboard/admin', accounts.ADMIN.token)).status, 200);
    assert.equal((await request('/dashboard/admin', accounts.MANAGER.token)).status, 403);
    assert.equal((await request('/dashboard/manager', accounts.MANAGER.token)).status, 200);
    assert.equal((await request('/dashboard/manager', accounts.STAFF.token)).status, 403);
    assert.equal((await request('/users', accounts.MANAGER.token, {})).status, 403);
    assert.equal((await request('/auth/login', undefined, { email: accounts.ADMIN.email, password, role: 'ADMIN' })).status, 400);
    assert.equal((await request('/auth/login', undefined, { email: accounts.ADMIN.email, password: 'wrong' })).status, 401);
    const createdId = randomUUID();
    const created = await request('/users', accounts.ADMIN.token, { email: `${createdId}@test.invalid`, name: 'Created user', password, role: 'STAFF' });
    assert.equal(created.status, 201);
    const createdUser = await created.json() as { id: string }; ids.push(createdUser.id);
    await pool.query("UPDATE sessions SET expires_at = now() - interval '1 second' WHERE user_id = $1", [ids[2]]);
    assert.equal((await request('/auth/me', accounts.STAFF.token)).status, 401);
    assert.equal((await request('/auth/logout', accounts.MANAGER.token, {})).status, 204);
    assert.equal((await request('/auth/me', accounts.MANAGER.token)).status, 401);

    const anonymous = await fetch(web, { redirect: 'manual' });
    assert.equal(anonymous.status, 307);
    assert.match(anonymous.headers.get('location') ?? '', /auth\/signin/);
    assert.equal((await fetch(`${web}/api/auth/login`, { method: 'POST', headers: { Origin: 'https://untrusted.invalid', 'Content-Type': 'application/json' }, body: '{}' })).status, 403);
    for (const role of ['ADMIN', 'MANAGER']) {
      const login = await fetch(`${web}/api/auth/login`, { method: 'POST', headers: { Origin: web, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: accounts[role].email, password }) });
      assert.equal(login.status, 200);
      const cookieHeader = login.headers.get('set-cookie') ?? '';
      assert.match(cookieHeader, /HttpOnly/i); assert.match(cookieHeader, /SameSite=lax/i);
      const cookie = cookieHeader.split(';')[0];
      const destination = (await login.json() as { destination: string }).destination;
      assert.equal(destination, role === 'ADMIN' ? '/' : '/manager');
      const page = await fetch(`${web}${destination}`, { headers: { Cookie: cookie } });
      assert.equal(page.status, 200);
      assert.match(await page.text(), role === 'ADMIN' ? /Admin Dashboard/ : /Manager Dashboard/);
      if (role === 'MANAGER') {
        const wrongPage = await fetch(web, { headers: { Cookie: cookie }, redirect: 'manual' });
        assert.equal(wrongPage.status, 307); assert.equal(wrongPage.headers.get('location'), '/manager');
      }
      const logout = await fetch(`${web}/api/auth/logout`, { method: 'POST', headers: { Origin: web, Cookie: cookie } });
      assert.equal(logout.status, 200);
      const revoked = await fetch(`${web}${destination}`, { headers: { Cookie: cookie }, redirect: 'manual' });
      assert.equal(revoked.status, 307);
    }
  } finally {
    if (ids.length) await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [ids]);
    await pool.end();
  }
});
