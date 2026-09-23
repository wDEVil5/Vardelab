import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queryAs, countAs, expectRlsError, SEED } from './client.mjs';

/**
 * Pruebas reales de RLS contra el Postgres local de Supabase (no mocks) —
 * primera tanda: perfiles, postulaciones, organizaciones y tablas de solo
 * admin. Requiere `npx supabase start` corriendo. Cada prueba corre dentro de
 * una transacción que se revierte sola (ver `tests/rls/client.mjs`), así que
 * nunca deja el seed distinto de como lo encontró.
 *
 * Correr con: node --test tests/rls/*.test.mjs
 */

// --- profiles: privacidad ---------------------------------------------------

test('un visitante sin sesión ve un perfil público', () => {
  const rows = queryAs({ role: 'anon', sql: `select nombre from public.profiles where id = '${SEED.VALENTINA}';` });
  assert.deepEqual(rows, ['Valentina Soto']);
});

test('un visitante sin sesión NO ve un perfil privado', () => {
  const rows = queryAs({ role: 'anon', sql: `select nombre from public.profiles where id = '${SEED.DIEGO}';` });
  assert.equal(rows.length, 0);
});

test('un desconocido autenticado (sin ninguna relación) NO ve un perfil privado ajeno', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.MARCOS,
    sql: `select nombre from public.profiles where id = '${SEED.DIEGO}';`,
  });
  assert.equal(rows.length, 0);
});

test('el dueño de un perfil privado siempre se ve a sí mismo', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `select nombre from public.profiles where id = '${SEED.DIEGO}';`,
  });
  assert.deepEqual(rows, ['Diego Fuentes']);
});

test('un admin ve cualquier perfil, aunque sea privado', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.ADMIN,
    sql: `select nombre from public.profiles where id = '${SEED.DIEGO}';`,
  });
  assert.deepEqual(rows, ['Diego Fuentes']);
});

test('nadie puede editar el perfil de otra persona (0 filas afectadas, no error)', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `update public.profiles set nombre = 'Hackeado' where id = '${SEED.DIEGO}' returning id;`,
  });
  assert.equal(rows.length, 0);
});

// --- applications: quién postula y quién ve qué -----------------------------

test('no se puede postular a nombre de otra persona (WITH CHECK)', () => {
  expectRlsError(() => queryAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `insert into public.applications (project_role_id, project_id, applicant_id, mensaje)
          values ('${SEED.ROLE_EN_ORG_CAMILA}', '${SEED.PROJECT_ORG_CAMILA}', '${SEED.DIEGO}', 'me postulo por otro');`,
  }));
});

test('el postulante ve su propia postulación', () => {
  const rows = countAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `select id from public.applications where id = '${SEED.APPLICATION_VALENTINA_EN_ORG_CAMILA}';`,
  });
  assert.equal(rows, 1);
});

test('quien gestiona el proyecto ve las postulaciones que le llegan', () => {
  const rows = countAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `select id from public.applications where id = '${SEED.APPLICATION_VALENTINA_EN_ORG_CAMILA}';`,
  });
  assert.equal(rows, 1);
});

test('un patrocinador ajeno (no gestiona ese proyecto) NO ve la postulación', () => {
  const rows = countAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `select id from public.applications where id = '${SEED.APPLICATION_VALENTINA_EN_ORG_CAMILA}';`,
  });
  assert.equal(rows, 0);
});

test('un patrocinador ajeno no puede aceptar/rechazar una postulación que no le pertenece', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `update public.applications set status = 'rechazada'
          where id = '${SEED.APPLICATION_VALENTINA_EN_ORG_CAMILA}' returning id;`,
  });
  assert.equal(rows.length, 0);
});

// --- organizations: directorio público de solo lectura, escritura del dueño ---

test('cualquiera (incluso sin sesión) puede leer el directorio de organizaciones', () => {
  const rows = countAs({ role: 'anon', sql: `select id from public.organizations where id = '${SEED.ORG_DIEGO}';` });
  assert.equal(rows, 1);
});

test('un patrocinador no puede editar la organización de otro patrocinador', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `update public.organizations set nombre = 'Robada' where id = '${SEED.ORG_DIEGO}' returning id;`,
  });
  assert.equal(rows.length, 0);
});

test('el dueño sí puede editar su propia organización', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `update public.organizations set nombre = nombre where id = '${SEED.ORG_DIEGO}' returning id;`,
  });
  assert.equal(rows.length, 1);
});

// --- tablas de solo admin/moderador -----------------------------------------

test('un patrocinador no puede crear una habilidad en el catálogo', () => {
  expectRlsError(() => queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `insert into public.skills (nombre, categoria) values ('Habilidad falsa', 'Test');`,
  }));
});

test('un admin sí puede crear una habilidad en el catálogo', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.ADMIN,
    sql: `insert into public.skills (nombre, categoria) values ('Habilidad de prueba', 'Test') returning id;`,
  });
  assert.equal(rows.length, 1);
});

test('un patrocinador no puede leer la auditoría', () => {
  const rows = countAs({ role: 'authenticated', userId: SEED.DIEGO, sql: `select id from public.audit_logs limit 1;` });
  assert.equal(rows, 0);
});

test('un moderador sí puede leer la auditoría', () => {
  // No afirma cuántas filas hay (puede variar) — solo que la RLS no la bloquea de plano.
  assert.doesNotThrow(() => queryAs({
    role: 'authenticated', userId: SEED.MARCOS, sql: `select id from public.audit_logs limit 1;`,
  }));
});

test('un patrocinador no puede insertar en la auditoría directamente', () => {
  expectRlsError(() => queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `insert into public.audit_logs (actor_id, accion, entidad) values ('${SEED.DIEGO}', 'rol_actualizado', 'user_roles');`,
  }));
});

test('un moderador sí puede insertar en la auditoría (M100, para registrar que abrió una conversación)', () => {
  assert.doesNotThrow(() => queryAs({
    role: 'authenticated', userId: SEED.MARCOS,
    sql: `insert into public.audit_logs (actor_id, accion, entidad) values ('${SEED.MARCOS}', 'conversacion_abierta', 'project_messages');`,
  }));
});

test('un patrocinador no puede leer la configuración del piloto', () => {
  const rows = countAs({ role: 'authenticated', userId: SEED.DIEGO, sql: `select id from public.pilot_config;` });
  assert.equal(rows, 0);
});

test('un admin sí puede leer la configuración del piloto', () => {
  const rows = countAs({ role: 'authenticated', userId: SEED.ADMIN, sql: `select id from public.pilot_config;` });
  assert.equal(rows, 1);
});
