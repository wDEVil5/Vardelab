import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queryAs, expectError, expectRlsError, SEED } from './client.mjs';

/**
 * Pruebas reales de RLS, tanda 4 (última): las funciones `security definer`
 * que las Server Actions llaman vía `.rpc(...)`. Son las más delicadas del
 * proyecto — `security definer` salta la RLS por completo, así que cada una
 * tiene que reautorizar a mano adentro; si a alguna se le olvida (o alguien
 * la rompe en el futuro), cualquier usuario autenticado podría invocarla
 * directo, sin pasar por la Server Action ni por ninguna policy.
 *
 * Mismo arnés que el resto de `tests/rls/`, ver `client.mjs` y
 * `policies.test.mjs`.
 */

// --- accept_application (M84) ------------------------------------------------

test('accept_application rechaza a quien no gestiona ese rol ni es admin', () => {
  expectError(
    () => queryAs({
      role: 'authenticated', userId: SEED.DIEGO,
      sql: `select public.accept_application('${SEED.APPLICATION_VALENTINA_EN_ORG_CAMILA}');`,
    }),
    /No autorizado/,
  );
});

test('accept_application con un id que no existe devuelve "no_encontrada"', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `select public.accept_application('00000000-0000-0000-0000-000000000000');`,
  });
  assert.deepEqual(rows, ['no_encontrada']);
});

test('accept_application sobre una postulación que ya no está "enviada" devuelve "ya_procesada"', () => {
  // f0000000-...-001 ya está 'aceptada' en el seed.
  const rows = queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `select public.accept_application('${SEED.APPLICATION_VALENTINA_EN_ORG_CAMILA}');`,
  });
  assert.deepEqual(rows, ['ya_procesada']);
});

// Postular exige ser 'estudiante' (`applications_insert_own`) — Valentina es
// la única cuenta de ese rol en el seed, y ya tiene una postulación activa en
// los dos proyectos existentes (M66: como máximo una por proyecto). Para
// poder insertar postulaciones nuevas sin chocar con eso, estas pruebas crean
// también un proyecto efímero propio (de la organización de Camila), además
// del rol — todo dentro de la misma transacción que se revierte sola.

test('accept_application da "sin_cupos" cuando el rol ya no tiene lugar', () => {
  const PROJECT_EFIMERO = 'f9000000-0000-0000-0000-00000000000b';
  const ROLE = 'f9000000-0000-0000-0000-000000000015';
  const APP_A = 'f9000000-0000-0000-0000-000000000016';
  const APP_B = 'f9000000-0000-0000-0000-000000000017';
  // Dos postulantes al mismo rol de un cupo: como Valentina (la única
  // estudiante del seed) no puede postular dos veces al mismo proyecto, la
  // segunda postulación se inserta ya en estado 'enviada' directo por la
  // gestora (fixture) — lo que importa para esta prueba es el conteo dentro
  // de `accept_application`, no cómo llegó la fila.
  const rows = queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `
      insert into public.projects (id, org_id, created_by, titulo, status) values ('${PROJECT_EFIMERO}', '${SEED.ORG_CAMILA}', '${SEED.CAMILA}', 'Proyecto efímero', 'seleccion');
      insert into public.project_roles (id, project_id, nombre, cupos) values ('${ROLE}', '${PROJECT_EFIMERO}', 'Rol de un cupo', 1);
      set request.jwt.claim.sub = '${SEED.VALENTINA}';
      insert into public.applications (id, project_role_id, project_id, applicant_id, mensaje)
        values ('${APP_A}', '${ROLE}', '${PROJECT_EFIMERO}', '${SEED.VALENTINA}', 'postulo A');
      set request.jwt.claim.sub = '${SEED.CAMILA}';
      select public.accept_application('${APP_A}');
      -- Segundo "postulante" (Marcos, moderador -- no cumpliría la RLS de
      -- insertar como estudiante): se inserta directo con role postgres
      -- (superusuario, salta la RLS) solo para armar el fixture; lo que se
      -- prueba es accept_application, no este insert.
      set role postgres;
      insert into public.applications (id, project_role_id, project_id, applicant_id, mensaje, status)
        values ('${APP_B}', '${ROLE}', '${PROJECT_EFIMERO}', '${SEED.MARCOS}', 'segundo postulante (fixture)', 'enviada');
      set role authenticated;
      set request.jwt.claim.sub = '${SEED.CAMILA}';
      select public.accept_application('${APP_B}');
    `,
  });
  assert.deepEqual(rows, ['ok', 'sin_cupos']);
});

test('accept_application, en el camino "ok", deja a la persona en el equipo del proyecto', () => {
  const PROJECT_EFIMERO = 'f9000000-0000-0000-0000-00000000000c';
  const ROLE = 'f9000000-0000-0000-0000-000000000013';
  const APP = 'f9000000-0000-0000-0000-000000000014';
  const rows = queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `
      insert into public.projects (id, org_id, created_by, titulo, status) values ('${PROJECT_EFIMERO}', '${SEED.ORG_CAMILA}', '${SEED.CAMILA}', 'Proyecto efímero', 'seleccion');
      insert into public.project_roles (id, project_id, nombre, cupos) values ('${ROLE}', '${PROJECT_EFIMERO}', 'Rol de prueba', 1);
      set request.jwt.claim.sub = '${SEED.VALENTINA}';
      insert into public.applications (id, project_role_id, project_id, applicant_id, mensaje)
        values ('${APP}', '${ROLE}', '${PROJECT_EFIMERO}', '${SEED.VALENTINA}', 'postulo');
      set request.jwt.claim.sub = '${SEED.CAMILA}';
      select public.accept_application('${APP}');
      select status::text from public.applications where id = '${APP}';
      select count(*)::text from public.team_members where user_id = '${SEED.VALENTINA}' and project_role_id = '${ROLE}';
    `,
  });
  assert.deepEqual(rows, ['ok', 'aceptada', '1']);
});

// --- set_user_role (M56) ------------------------------------------------------

test('set_user_role rechaza a quien no es admin', () => {
  expectError(
    () => queryAs({
      role: 'authenticated', userId: SEED.DIEGO,
      sql: `select public.set_user_role('${SEED.MARCOS}', 'estudiante');`,
    }),
    /No autorizado/,
  );
});

test('set_user_role, hecho por un admin, reemplaza el rol de verdad', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.ADMIN,
    sql: `
      select public.set_user_role('${SEED.MARCOS}', 'mentor');
      select role::text from public.user_roles where user_id = '${SEED.MARCOS}';
    `,
  });
  assert.deepEqual(rows, ['mentor']); // reemplazó 'moderador' por 'mentor', no lo agregó aparte
});

// --- find_user_id_by_email (M37, acceso revocado a anon en M82) --------------

test('un visitante sin sesión no puede buscar un usuario por correo', () => {
  expectRlsError(() => queryAs({
    role: 'anon',
    sql: `select public.find_user_id_by_email('estudiante@demo.cl');`,
  }));
});

test('un usuario autenticado sí puede buscar por correo (lo necesita la invitación a organizaciones)', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `select public.find_user_id_by_email('estudiante@demo.cl');`,
  });
  assert.deepEqual(rows, [SEED.VALENTINA]);
});

// --- org_recipient_ids (M39) --------------------------------------------------

test('org_recipient_ids devuelve al dueño de la organización', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.VALENTINA, // cualquiera con sesión, no hace falta relación con la org
    sql: `select public.org_recipient_ids('${SEED.ORG_CAMILA}');`,
  });
  assert.ok(rows.includes(SEED.CAMILA));
});

// --- pilot_registro_abierto (M24) --------------------------------------------

test('pilot_registro_abierto se puede leer sin sesión (lo necesita el registro)', () => {
  assert.doesNotThrow(() => queryAs({ role: 'anon', sql: `select public.pilot_registro_abierto();` }));
});
