import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, form, expectRedirect } from './helpers.mjs';

const USER = { id: 'u1' };

test('el nombre no puede quedar vacío', async () => {
  const { exports } = load('features/profile/actions.ts', { currentUser: USER });
  const result = await exports.updateProfile({}, form({ nombre: '' }));
  assert.match(result.error, /nombre no puede quedar vacío/);
});

test('un semestre fuera de 1-14 se rechaza', async () => {
  const { exports } = load('features/profile/actions.ts', { currentUser: USER });
  const result = await exports.updateProfile({}, form({ nombre: 'Valentina', semestre: '20' }));
  assert.match(result.error, /entre 1 y 14/);
});

test('guardar el perfil funciona y redirige', async () => {
  const { exports } = load('features/profile/actions.ts', {
    currentUser: USER,
    responses: [{ error: null }],
  });
  const to = await expectRedirect(
    exports.updateProfile({}, form({ nombre: 'Valentina', github: 'vsoto' })),
  );
  assert.equal(to, '/perfil?guardado=1');
});

test('un avatar con formato no admitido se rechaza antes de subir nada', async () => {
  const { exports, storageUploads } = load('features/profile/actions.ts', { currentUser: USER });
  const avatar = new File(['x'], 'foto.gif', { type: 'image/gif' });
  const result = await exports.uploadAvatar({}, form({ avatar }));
  assert.match(result.error, /Formato no admitido/);
  assert.equal(storageUploads.length, 0);
});

test('un avatar válido se sube y se guarda en el perfil', async () => {
  const { exports, storageUploads } = load('features/profile/actions.ts', {
    currentUser: USER,
    responses: [{ error: null }],
  });
  const avatar = new File(['x'], 'foto.png', { type: 'image/png' });
  const result = await exports.uploadAvatar({}, form({ avatar }));
  assert.equal(result.error, undefined);
  assert.equal(storageUploads.length, 1);
  assert.equal(storageUploads[0].bucket, 'avatars');
});

test('elegir un avatar del catálogo que ya no está activo no lo aplica', async () => {
  const { exports } = load('features/profile/actions.ts', {
    currentUser: USER,
    responses: [{ data: null, error: null }],
  });
  const result = await exports.selectAvatarPreset({}, form({ presetId: 'a1' }));
  assert.match(result.error, /ya no está disponible/);
});

test('elegir un avatar del catálogo activo lo aplica', async () => {
  const { exports } = load('features/profile/actions.ts', {
    currentUser: USER,
    responses: [{ data: { url: 'https://fake/avatar-3.png' }, error: null }, { error: null }],
  });
  const result = await exports.selectAvatarPreset({}, form({ presetId: 'a1' }));
  assert.equal(result.error, undefined);
});

test('agregar una habilidad ya declarada no se duplica', async () => {
  const { exports } = load('features/profile/actions.ts', {
    currentUser: USER,
    responses: [{ error: { code: '23505', message: 'duplicate key' } }],
  });
  const result = await exports.addProfileSkill({}, form({ skillId: 's1', nivel: 'basico' }));
  assert.match(result.error, /ya está en tu perfil/);
});

test('quitar una habilidad sin sesión no revienta', async () => {
  const { exports, queries } = load('features/profile/actions.ts');
  const result = await exports.deleteProfileSkill({}, form({ skillId: 's1' }));
  assert.match(result.error, /sesión expiró/);
  assert.equal(queries.length, 0);
});

test('eliminar la cuenta no procede si falla el chequeo de organización propia', async () => {
  const { exports, adminAuthCalls } = load('features/profile/actions.ts', {
    currentUser: USER,
    responses: [{ count: null, error: { message: 'timeout' } }],
  });
  const result = await exports.deleteAccount();
  assert.match(result.error, /No se pudo verificar/);
  assert.equal(adminAuthCalls.length, 0);
});

test('eliminar la cuenta se bloquea si es dueño de una organización', async () => {
  const { exports, adminAuthCalls } = load('features/profile/actions.ts', {
    currentUser: USER,
    responses: [{ count: 1 }],
  });
  const result = await exports.deleteAccount();
  assert.match(result.error, /Contacta a soporte/);
  assert.equal(adminAuthCalls.length, 0);
});

test('eliminar la cuenta sin organizaciones propias la borra', async () => {
  const { exports, adminAuthCalls } = load('features/profile/actions.ts', {
    currentUser: USER,
    responses: [{ count: 0 }],
  });
  const to = await expectRedirect(exports.deleteAccount());
  assert.equal(to, '/?cuenta-eliminada=1');
  assert.equal(adminAuthCalls.length, 1);
  assert.equal(adminAuthCalls[0].userId, 'u1');
});

// --- setProfileVisibility ------------------------------------------------------

test('un valor de visibilidad inválido no llega a tocar la base', async () => {
  const { exports, queries } = load('features/profile/actions.ts', { currentUser: USER });
  const result = await exports.setProfileVisibility({}, form({ visibility: 'invalido' }));
  assert.ok(result.error);
  assert.equal(queries.length, 0);
});

test('cambiar la visibilidad funciona sin error', async () => {
  const { exports } = load('features/profile/actions.ts', {
    currentUser: USER,
    responses: [{ error: null }],
  });
  const result = await exports.setProfileVisibility({}, form({ visibility: 'privado' }));
  assert.equal(result.error, undefined);
});

test('si falla el update, setProfileVisibility devuelve el error en vez de tragárselo', async () => {
  const { exports } = load('features/profile/actions.ts', {
    currentUser: USER,
    responses: [{ error: { message: 'db caída' } }],
  });
  const result = await exports.setProfileVisibility({}, form({ visibility: 'privado' }));
  assert.ok(result.error);
});

// --- skipOnboarding --------------------------------------------------------------

test('omitir el onboarding funciona sin error', async () => {
  const { exports } = load('features/profile/actions.ts', {
    currentUser: USER,
    responses: [{ error: null }],
  });
  const result = await exports.skipOnboarding();
  assert.equal(result.error, undefined);
});

test('si falla el update, skipOnboarding devuelve el error en vez de tragárselo', async () => {
  const { exports } = load('features/profile/actions.ts', {
    currentUser: USER,
    responses: [{ error: { message: 'db caída' } }],
  });
  const result = await exports.skipOnboarding();
  assert.ok(result.error);
});
