import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../src/modules/auth/password';
test('password hashing uses different salts and verifies only the correct password', async () => {
  const first = await hashPassword('a-long-test-password');
  const second = await hashPassword('a-long-test-password');
  assert.notEqual(first, second);
  assert.equal(await verifyPassword('a-long-test-password', first), true);
  assert.equal(await verifyPassword('wrong-password', first), false);
  assert.equal(await verifyPassword('anything', 'corrupt'), false);
});
