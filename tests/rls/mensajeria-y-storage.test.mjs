import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queryAs, countAs, expectRlsError, SEED } from './client.mjs';

/**
 * Pruebas reales de RLS, tanda 5: las 6 tablas que la auditoría de
 * producción del 2026-09-20 marcó sin cobertura (`organization_members`,
 * `project_messages`, `project_observations`, `project_role_skills`,
 * `avatar_presets`, `storage.objects`). Mismo arnés que el resto de
 * `tests/rls/` — ver `client.mjs` y `policies.test.mjs` para el mecanismo.
 *
 * Fixtures de `supabase/seed.sql`: proyecto 001 (de Camila), con Valentina
 * como única integrante del equipo; Diego no tiene ninguna relación con ese
 * proyecto (dueño de una organización distinta) y sirve de "ajeno" en todos
 * los casos; Marcos es moderador puro, sin relación con ningún proyecto ni
 * organización.
 */

const PROJECT = 'b0000000-0000-0000-0000-000000000001';
const MILESTONE = 'e0000000-0000-0000-0000-000000000001';
const ROLE_DATOS = 'c0000000-0000-0000-0000-000000000001'; // rol "Datos" del proyecto de Camila

// --- organization_members ----------------------------------------------------

const INVITE = 'aa000000-0000-0000-0000-000000000001';

test('el dueño de una organización puede invitar a alguien', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `insert into public.organization_members (id, org_id, invited_email, invited_by)
          values ('${INVITE}', '${SEED.ORG_CAMILA}', 'nuevo@x.cl', '${SEED.CAMILA}')
          returning id;`,
  });
  assert.deepEqual(rows, [INVITE]);
});

test('un patrocinador ajeno no puede invitar a la organización de otro', () => {
  expectRlsError(() => queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `insert into public.organization_members (id, org_id, invited_email, invited_by)
          values ('${INVITE}', '${SEED.ORG_CAMILA}', 'intruso@x.cl', '${SEED.DIEGO}');`,
  }));
});

test('un miembro activo (no dueño) tiene el mismo acceso que el dueño para invitar', () => {
  // Camila (dueña) agrega a Diego como miembro activo; con esa membresía,
  // Diego pasa a poder invitar él mismo a esa organización — mismo criterio
  // que `is_org_member` usa para "gestiona esta organización".
  const rows = queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `
      insert into public.organization_members (org_id, invited_email, invited_by, user_id, status)
      values ('${SEED.ORG_CAMILA}', 'diego-miembro@x.cl', '${SEED.CAMILA}', '${SEED.DIEGO}', 'activo');
      set request.jwt.claim.sub = '${SEED.DIEGO}';
      insert into public.organization_members (id, org_id, invited_email, invited_by)
      values ('${INVITE}', '${SEED.ORG_CAMILA}', 'otro-mas@x.cl', '${SEED.DIEGO}')
      returning id;
    `,
  });
  assert.deepEqual(rows, [INVITE]);
});

test('alguien sin ninguna relación no ve las membresías de una organización ajena', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `
      insert into public.organization_members (id, org_id, invited_email, invited_by)
      values ('${INVITE}', '${SEED.ORG_CAMILA}', 'nuevo@x.cl', '${SEED.CAMILA}');
      set request.jwt.claim.sub = '${SEED.MARCOS}';
      select id from public.organization_members where id = '${INVITE}';
    `,
  });
  assert.deepEqual(rows, []);
});

test('el propio invitado ve su fila pendiente aunque no sea miembro activo todavía', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `
      insert into public.organization_members (id, org_id, invited_email, invited_by, user_id, status)
      values ('${INVITE}', '${SEED.ORG_CAMILA}', 'marcos@x.cl', '${SEED.CAMILA}', '${SEED.MARCOS}', 'pendiente');
      set request.jwt.claim.sub = '${SEED.MARCOS}';
      select id from public.organization_members where id = '${INVITE}';
    `,
  });
  assert.deepEqual(rows, [INVITE]);
});

test('el propio invitado puede declinar (borrar) su propia invitación pendiente', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `
      insert into public.organization_members (id, org_id, invited_email, invited_by, user_id, status)
      values ('${INVITE}', '${SEED.ORG_CAMILA}', 'marcos@x.cl', '${SEED.CAMILA}', '${SEED.MARCOS}', 'pendiente');
      set request.jwt.claim.sub = '${SEED.MARCOS}';
      delete from public.organization_members where id = '${INVITE}' returning id;
    `,
  });
  assert.deepEqual(rows, [INVITE]);
});

// --- project_messages ---------------------------------------------------------

const MESSAGE = 'aa000000-0000-0000-0000-000000000002';

test('quien gestiona el proyecto puede enviar un mensaje en nombre propio', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `insert into public.project_messages (id, project_id, sender_id, body)
          values ('${MESSAGE}', '${PROJECT}', '${SEED.CAMILA}', 'Hola equipo') returning id;`,
  });
  assert.deepEqual(rows, [MESSAGE]);
});

test('un integrante del equipo puede enviar y leer mensajes de su proyecto', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `
      insert into public.project_messages (id, project_id, sender_id, body)
      values ('${MESSAGE}', '${PROJECT}', '${SEED.VALENTINA}', 'Aquí voy con los datos');
      select id from public.project_messages where id = '${MESSAGE}';
    `,
  });
  assert.deepEqual(rows, [MESSAGE]);
});

test('no se puede enviar un mensaje a nombre de otra persona', () => {
  expectRlsError(() => queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `insert into public.project_messages (id, project_id, sender_id, body)
          values ('${MESSAGE}', '${PROJECT}', '${SEED.VALENTINA}', 'suplantando');`,
  }));
});

test('un patrocinador ajeno no puede enviar mensajes en un proyecto que no gestiona', () => {
  expectRlsError(() => queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `insert into public.project_messages (id, project_id, sender_id, body)
          values ('${MESSAGE}', '${PROJECT}', '${SEED.DIEGO}', 'me meto igual');`,
  }));
});

test('un patrocinador ajeno no ve los mensajes de un proyecto que no gestiona', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `
      insert into public.project_messages (id, project_id, sender_id, body)
      values ('${MESSAGE}', '${PROJECT}', '${SEED.CAMILA}', 'Hola equipo');
      set request.jwt.claim.sub = '${SEED.DIEGO}';
      select id from public.project_messages where id = '${MESSAGE}';
    `,
  });
  assert.deepEqual(rows, []);
});

test('un moderador sin relación con el proyecto no ve sus mensajes (a diferencia de las observaciones)', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `
      insert into public.project_messages (id, project_id, sender_id, body)
      values ('${MESSAGE}', '${PROJECT}', '${SEED.CAMILA}', 'Hola equipo');
      set request.jwt.claim.sub = '${SEED.MARCOS}';
      select id from public.project_messages where id = '${MESSAGE}';
    `,
  });
  assert.deepEqual(rows, []);
});

// --- project_observations ------------------------------------------------------

const OBSERVATION = 'aa000000-0000-0000-0000-000000000003';

test('un moderador puede crear una observación en un proyecto', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.MARCOS,
    sql: `insert into public.project_observations (id, project_id, categoria, texto)
          values ('${OBSERVATION}', '${PROJECT}', 'alcance', 'Acota el alcance') returning id;`,
  });
  assert.deepEqual(rows, [OBSERVATION]);
});

test('quien gestiona el proyecto no puede crear observaciones (solo moderador/admin)', () => {
  expectRlsError(() => queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `insert into public.project_observations (id, project_id, categoria, texto)
          values ('${OBSERVATION}', '${PROJECT}', 'alcance', 'me autoapruebo');`,
  }));
});

test('quien gestiona el proyecto ve la observación y puede marcarla resuelta', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.MARCOS,
    sql: `
      insert into public.project_observations (id, project_id, categoria, texto)
      values ('${OBSERVATION}', '${PROJECT}', 'alcance', 'Acota el alcance');
      set request.jwt.claim.sub = '${SEED.CAMILA}';
      update public.project_observations set resuelta = true where id = '${OBSERVATION}' returning id;
    `,
  });
  assert.deepEqual(rows, [OBSERVATION]);
});

test('un integrante del equipo (no gestor) no ve las observaciones del moderador', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.MARCOS,
    sql: `
      insert into public.project_observations (id, project_id, categoria, texto)
      values ('${OBSERVATION}', '${PROJECT}', 'alcance', 'Acota el alcance');
      set request.jwt.claim.sub = '${SEED.VALENTINA}';
      select id from public.project_observations where id = '${OBSERVATION}';
    `,
  });
  assert.deepEqual(rows, []);
});

test('quien gestiona el proyecto no puede borrar una observación (solo moderador/admin)', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.MARCOS,
    sql: `
      insert into public.project_observations (id, project_id, categoria, texto)
      values ('${OBSERVATION}', '${PROJECT}', 'alcance', 'Acota el alcance');
      set request.jwt.claim.sub = '${SEED.CAMILA}';
      delete from public.project_observations where id = '${OBSERVATION}' returning id;
    `,
  });
  assert.deepEqual(rows, []);
});

test('un moderador puede borrar la observación', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.MARCOS,
    sql: `
      insert into public.project_observations (id, project_id, categoria, texto)
      values ('${OBSERVATION}', '${PROJECT}', 'alcance', 'Acota el alcance');
      delete from public.project_observations where id = '${OBSERVATION}' returning id;
    `,
  });
  assert.deepEqual(rows, [OBSERVATION]);
});

// --- project_role_skills --------------------------------------------------------

test('cualquiera sin sesión ve las habilidades exigidas por un rol de un proyecto publicado', () => {
  const rows = countAs({
    role: 'anon',
    sql: `select id from public.project_role_skills where project_role_id = '${ROLE_DATOS}';`,
  });
  assert.equal(rows, 2); // sembradas en supabase/seed.sql: "Bases de datos" y "Análisis de datos"
});

test('un patrocinador ajeno no puede agregar una habilidad exigida a un rol que no gestiona', () => {
  expectRlsError(() => queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `insert into public.project_role_skills (project_role_id, skill_id)
          values ('${ROLE_DATOS}', (select id from public.skills where nombre = 'Frontend'));`,
  }));
});

test('quien gestiona el proyecto puede agregar una habilidad exigida a su propio rol', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `insert into public.project_role_skills (project_role_id, skill_id)
          values ('${ROLE_DATOS}', (select id from public.skills where nombre = 'Frontend'))
          returning id;`,
  });
  assert.equal(rows.length, 1);
});

// --- avatar_presets --------------------------------------------------------------

const AVATAR_INACTIVO = 'aa000000-0000-0000-0000-000000000004';

test('cualquier usuario ve los avatares activos del catálogo', () => {
  const rows = countAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `select id from public.avatar_presets where etiqueta = 'Electric';`,
  });
  assert.equal(rows, 1); // sembrado por la migración M26
});

test('un usuario normal no ve un avatar desactivado', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.ADMIN,
    sql: `
      insert into public.avatar_presets (id, url, etiqueta, activo)
      values ('${AVATAR_INACTIVO}', '/x.svg', 'Fuera de catálogo', false);
      set request.jwt.claim.sub = '${SEED.VALENTINA}';
      select id from public.avatar_presets where id = '${AVATAR_INACTIVO}';
    `,
  });
  assert.deepEqual(rows, []);
});

test('un admin sí ve un avatar desactivado', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.ADMIN,
    sql: `
      insert into public.avatar_presets (id, url, etiqueta, activo)
      values ('${AVATAR_INACTIVO}', '/x.svg', 'Fuera de catálogo', false);
      select id from public.avatar_presets where id = '${AVATAR_INACTIVO}';
    `,
  });
  assert.deepEqual(rows, [AVATAR_INACTIVO]);
});

test('un usuario normal no puede agregar un avatar al catálogo', () => {
  expectRlsError(() => queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `insert into public.avatar_presets (url, etiqueta) values ('/x.svg', 'Intruso');`,
  }));
});

test('un admin puede agregar un avatar al catálogo', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.ADMIN,
    sql: `insert into public.avatar_presets (id, url, etiqueta) values ('${AVATAR_INACTIVO}', '/x.svg', 'Nuevo') returning id;`,
  });
  assert.deepEqual(rows, [AVATAR_INACTIVO]);
});

// --- storage.objects -------------------------------------------------------------

test('cualquiera puede ver una foto de perfil (bucket avatars es público)', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `
      insert into storage.objects (bucket_id, name) values ('avatars', '${SEED.VALENTINA}');
      set role anon;
      select name from storage.objects where bucket_id = 'avatars' and name = '${SEED.VALENTINA}';
    `,
  });
  assert.deepEqual(rows, [SEED.VALENTINA]);
});

test('nadie puede subir una foto de perfil a nombre de otra persona', () => {
  expectRlsError(() => queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `insert into storage.objects (bucket_id, name) values ('avatars', '${SEED.VALENTINA}');`,
  }));
});

test('el dueño de una organización puede subir su logo', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `insert into storage.objects (bucket_id, name) values ('org-logos', '${SEED.ORG_CAMILA}') returning name;`,
  });
  assert.deepEqual(rows, [SEED.ORG_CAMILA]);
});

test('un patrocinador ajeno no puede subir el logo de una organización que no es suya', () => {
  expectRlsError(() => queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `insert into storage.objects (bucket_id, name) values ('org-logos', '${SEED.ORG_CAMILA}');`,
  }));
});

test('un miembro activo de la organización (no dueño) también puede subir su logo', () => {
  // `owns_org()` (usada por la policy del logo) es, desde M38, un alias de
  // `is_org_member()` — dueño y miembro activo quedan con el mismo acceso a
  // propósito ("dueño y miembros con permisos iguales", ver comentario de
  // M38). El comentario de M35 que documentó esta policy quedó desactualizado
  // en ese punto (dice "solo del dueño"), pero el criterio real ya cambió.
  const rows = queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `
      insert into public.organization_members (org_id, invited_email, invited_by, user_id, status)
      values ('${SEED.ORG_CAMILA}', 'diego-miembro@x.cl', '${SEED.CAMILA}', '${SEED.DIEGO}', 'activo');
      set request.jwt.claim.sub = '${SEED.DIEGO}';
      insert into storage.objects (bucket_id, name) values ('org-logos', '${SEED.ORG_CAMILA}')
      returning name;
    `,
  });
  assert.deepEqual(rows, [SEED.ORG_CAMILA]);
});

test('un integrante del equipo puede subir un archivo de entrega de su propio proyecto', () => {
  const path = `${PROJECT}/${MILESTONE}/informe.pdf`;
  const rows = queryAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `insert into storage.objects (bucket_id, name) values ('submission-files', '${path}') returning name;`,
  });
  assert.deepEqual(rows, [path]);
});

test('un patrocinador ajeno no puede ver los archivos de entrega de un proyecto que no gestiona', () => {
  const path = `${PROJECT}/${MILESTONE}/informe.pdf`;
  const rows = queryAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `
      insert into storage.objects (bucket_id, name) values ('submission-files', '${path}');
      set request.jwt.claim.sub = '${SEED.DIEGO}';
      select name from storage.objects where bucket_id = 'submission-files' and name = '${path}';
    `,
  });
  assert.deepEqual(rows, []);
});
