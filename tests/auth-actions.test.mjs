import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, form, expectRedirect } from './helpers.mjs';

const PASSWORD_VALIDA = 'Abcdef12';

test('registrarse con una contraseña débil no llega a Supabase', async () => {
  const { exports, authCalls } = load('features/auth/actions.ts');
  const result = await exports.signUp({}, form({
    email: 'x@x.cl', password: 'debil', nombre: 'X', rol: 'estudiante',
  }));
  assert.match(result.error, /no cumple los requisitos/);
  assert.equal(authCalls.length, 0);
});

test('registrarse con un rol que no es de autoservicio se rechaza', async () => {
  const { exports, authCalls } = load('features/auth/actions.ts');
  const result = await exports.signUp({}, form({
    email: 'x@x.cl', password: PASSWORD_VALIDA, nombre: 'X', rol: 'admin',
  }));
  assert.match(result.error, /tipo de cuenta válido/);
  assert.equal(authCalls.length, 0);
});

test('registrarse con demasiados intentos desde la misma IP se bloquea', async () => {
  const { exports, authCalls } = load('features/auth/actions.ts', { rateLimitOk: false });
  const result = await exports.signUp({}, form({
    email: 'x@x.cl', password: PASSWORD_VALIDA, nombre: 'X', rol: 'estudiante',
  }));
  assert.match(result.error, /Demasiados intentos/);
  assert.equal(authCalls.length, 0);
});

test('registrarse con el registro del piloto pausado se rechaza', async () => {
  const { exports } = load('features/auth/actions.ts', {
    rpcResponses: [{ data: false, error: null }],
  });
  const result = await exports.signUp({}, form({
    email: 'x@x.cl', password: PASSWORD_VALIDA, nombre: 'X', rol: 'estudiante',
  }));
  assert.match(result.error, /registro de nuevas cuentas está pausado/);
});

test('registrarse con datos válidos no redirige — avisa que revise el correo', async () => {
  const { exports, authCalls } = load('features/auth/actions.ts', {
    rpcResponses: [{ data: true, error: null }],
    authResponses: { signUp: [{ data: {}, error: null }] },
  });
  const result = await exports.signUp({}, form({
    email: 'valentina@x.cl', password: PASSWORD_VALIDA, nombre: 'Valentina', rol: 'estudiante',
  }));
  assert.equal(result.ok, true);
  assert.equal(authCalls[0].method, 'signUp');
  assert.equal(authCalls[0].args.email, 'valentina@x.cl');
});

test('un correo ya registrado al crear cuenta se traduce a un mensaje claro', async () => {
  const { exports } = load('features/auth/actions.ts', {
    rpcResponses: [{ data: true, error: null }],
    authResponses: { signUp: [{ data: {}, error: { message: 'User already registered' } }] },
  });
  const result = await exports.signUp({}, form({
    email: 'x@x.cl', password: PASSWORD_VALIDA, nombre: 'X', rol: 'estudiante',
  }));
  assert.match(result.error, /Ya existe una cuenta/);
});

test('ingresar con demasiados intentos por correo se bloquea aunque la IP esté bien', async () => {
  const { exports, authCalls } = load('features/auth/actions.ts', {
    rateLimitOk: [true, false], // login:ip pasa, login:email no
  });
  const result = await exports.signIn({}, form({ email: 'x@x.cl', password: 'lo-que-sea' }));
  assert.match(result.error, /Demasiados intentos/);
  assert.equal(authCalls.length, 0);
});

test('ingresar con credenciales inválidas se traduce a un mensaje claro', async () => {
  const { exports } = load('features/auth/actions.ts', {
    authResponses: { signInWithPassword: [{ data: {}, error: { message: 'Invalid login credentials' } }] },
  });
  const result = await exports.signIn({}, form({ email: 'x@x.cl', password: 'malacontra' }));
  assert.match(result.error, /Correo o contraseña incorrectos/);
});

test('ingresar con credenciales válidas responde ok (el redirect lo hace el cliente)', async () => {
  const { exports } = load('features/auth/actions.ts', {
    authResponses: { signInWithPassword: [{ data: {}, error: null }] },
  });
  const result = await exports.signIn({}, form({ email: 'x@x.cl', password: PASSWORD_VALIDA }));
  assert.equal(result.ok, true);
});

test('pedir recuperar contraseña siempre responde ok, exista o no la cuenta', async () => {
  const { exports } = load('features/auth/actions.ts', {
    authResponses: { resetPasswordForEmail: [{ data: {}, error: null }] },
  });
  const result = await exports.requestPasswordReset({}, form({ email: 'nadie@x.cl' }));
  assert.equal(result.ok, true);
});

test('pedir recuperar contraseña con el límite excedido igual responde ok (no delata el motivo)', async () => {
  const { exports, authCalls } = load('features/auth/actions.ts', { rateLimitOk: false });
  const result = await exports.requestPasswordReset({}, form({ email: 'x@x.cl' }));
  assert.equal(result.ok, true);
  assert.equal(authCalls.length, 0);
});

test('definir nueva contraseña sin un enlace válido (sin sesión) no la cambia', async () => {
  const { exports, authCalls } = load('features/auth/actions.ts');
  const result = await exports.updatePassword({}, form({ password: PASSWORD_VALIDA }));
  assert.match(result.error, /enlace expiró/);
  assert.equal(authCalls.length, 0);
});

test('definir nueva contraseña con sesión activa funciona', async () => {
  const { exports } = load('features/auth/actions.ts', {
    currentUser: { id: 'u1', email: 'x@x.cl' },
    authResponses: { updateUser: [{ data: {}, error: null }] },
  });
  const to = await expectRedirect(exports.updatePassword({}, form({ password: PASSWORD_VALIDA })));
  assert.equal(to, '/inicio');
});

test('cambiar contraseña con la actual incorrecta no la cambia', async () => {
  const { exports, authCalls } = load('features/auth/actions.ts', {
    currentUser: { id: 'u1', email: 'x@x.cl' },
    authResponses: { signInWithPassword: [{ data: {}, error: { message: 'Invalid login credentials' } }] },
  });
  const result = await exports.changePassword({}, form({
    currentPassword: 'incorrecta', password: PASSWORD_VALIDA, confirmPassword: PASSWORD_VALIDA,
  }));
  assert.match(result.error, /actual no es correcta/);
  assert.equal(authCalls.some((c) => c.method === 'updateUser'), false);
});

test('cambiar contraseña con demasiados intentos de reautenticación se bloquea sin llamar a Supabase', async () => {
  const { exports, authCalls } = load('features/auth/actions.ts', {
    currentUser: { id: 'u1', email: 'x@x.cl' },
    rateLimitOk: false,
  });
  const result = await exports.changePassword({}, form({
    currentPassword: 'ActualBuena1', password: PASSWORD_VALIDA, confirmPassword: PASSWORD_VALIDA,
  }));
  assert.match(result.error, /Demasiados intentos/);
  assert.equal(authCalls.length, 0);
});

test('cambiar contraseña con confirmación que no coincide no la cambia', async () => {
  const { exports } = load('features/auth/actions.ts', { currentUser: { id: 'u1', email: 'x@x.cl' } });
  const result = await exports.changePassword({}, form({
    currentPassword: 'ActualBuena1', password: PASSWORD_VALIDA, confirmPassword: 'OtraCosa12',
  }));
  assert.match(result.error, /no coinciden/);
});

test('cambiar contraseña con todo correcto re-autentica y actualiza', async () => {
  const { exports, authCalls } = load('features/auth/actions.ts', {
    currentUser: { id: 'u1', email: 'x@x.cl' },
    authResponses: {
      signInWithPassword: [{ data: {}, error: null }],
      updateUser: [{ data: {}, error: null }],
    },
  });
  const to = await expectRedirect(exports.changePassword({}, form({
    currentPassword: 'ActualBuena1', password: PASSWORD_VALIDA, confirmPassword: PASSWORD_VALIDA,
  })));
  assert.equal(to, '/perfil?guardado=contrasena');
  assert.equal(authCalls.filter((c) => c.method === 'signInWithPassword').length, 1);
});

test('pedir cambiar el correo al que ya se tiene no hace nada', async () => {
  const { exports } = load('features/auth/actions.ts', { currentUser: { id: 'u1', email: 'actual@x.cl' } });
  const result = await exports.requestEmailChange({}, form({
    currentPassword: 'algo', newEmail: 'Actual@x.cl',
  }));
  assert.match(result.error, /ya es tu correo actual/);
});

test('pedir cambiar el correo a uno ya usado por otra cuenta se traduce a un mensaje claro', async () => {
  const { exports } = load('features/auth/actions.ts', {
    currentUser: { id: 'u1', email: 'actual@x.cl' },
    authResponses: {
      signInWithPassword: [{ data: {}, error: null }],
      updateUser: [{ data: {}, error: { message: 'email address already exists' } }],
    },
  });
  const result = await exports.requestEmailChange({}, form({
    currentPassword: 'ActualBuena1', newEmail: 'ocupado@x.cl',
  }));
  assert.match(result.error, /Ya existe una cuenta/);
});

test('pedir cambiar el correo con demasiados intentos de reautenticación se bloquea sin llamar a Supabase', async () => {
  const { exports, authCalls } = load('features/auth/actions.ts', {
    currentUser: { id: 'u1', email: 'actual@x.cl' },
    rateLimitOk: false,
  });
  const result = await exports.requestEmailChange({}, form({
    currentPassword: 'ActualBuena1', newEmail: 'nuevo@x.cl',
  }));
  assert.match(result.error, /Demasiados intentos/);
  assert.equal(authCalls.length, 0);
});

test('pedir cambiar el correo con todo correcto dispara la confirmación doble', async () => {
  const { exports, authCalls } = load('features/auth/actions.ts', {
    currentUser: { id: 'u1', email: 'actual@x.cl' },
    authResponses: {
      signInWithPassword: [{ data: {}, error: null }],
      updateUser: [{ data: {}, error: null }],
    },
  });
  const result = await exports.requestEmailChange({}, form({
    currentPassword: 'ActualBuena1', newEmail: 'nuevo@x.cl',
  }));
  assert.equal(result.ok, true);
  const update = authCalls.find((c) => c.method === 'updateUser');
  assert.equal(update.args.attrs.email, 'nuevo@x.cl');
});
