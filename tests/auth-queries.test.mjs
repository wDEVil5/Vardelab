import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, expectRedirect } from './helpers.mjs';

test('requireUser devuelve el usuario si hay sesión', async () => {
  const { exports } = load('features/auth/queries.ts');
  const supabaseConSesion = {
    auth: { getUser: async () => ({ data: { user: { id: 'u1', email: 'x@x.cl' } } }) },
  };
  const user = await exports.requireUser(supabaseConSesion);
  assert.equal(user.id, 'u1');
});

test('requireUser redirige a /ingresar sin sesión', async () => {
  const { exports } = load('features/auth/queries.ts');
  const supabaseSinSesion = { auth: { getUser: async () => ({ data: { user: null } }) } };
  const to = await expectRedirect(exports.requireUser(supabaseSinSesion));
  assert.equal(to, '/ingresar');
});

test('requireUser respeta el `next` al redirigir sin sesión', async () => {
  const { exports } = load('features/auth/queries.ts');
  const supabaseSinSesion = { auth: { getUser: async () => ({ data: { user: null } }) } };
  const to = await expectRedirect(exports.requireUser(supabaseSinSesion, '/perfil'));
  assert.equal(to, '/ingresar?next=/perfil');
});
