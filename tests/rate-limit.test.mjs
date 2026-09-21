import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './helpers.mjs';

test('checkRateLimit falla abierto por defecto si el RPC da error', async () => {
  const { exports } = load('lib/rate-limit.ts', {
    rpcResponses: [{ data: null, error: { message: 'timeout' } }],
  });
  const result = await exports.checkRateLimit('login:email', 'x@x.cl', 8, 900);
  assert.equal(result, true);
});

test('checkRateLimit falla cerrado si el RPC da error y se pide failClosed', async () => {
  const { exports } = load('lib/rate-limit.ts', {
    rpcResponses: [{ data: null, error: { message: 'timeout' } }],
  });
  const result = await exports.checkRateLimit('signup:ip', '203.0.113.1', 5, 3600, { failClosed: true });
  assert.equal(result, false);
});

test('checkRateLimit respeta el resultado real del RPC cuando no hay error', async () => {
  const { exports } = load('lib/rate-limit.ts', {
    rpcResponses: [{ data: false, error: null }],
  });
  const result = await exports.checkRateLimit('reset:email', 'x@x.cl', 3, 900, { failClosed: true });
  assert.equal(result, false);
});
