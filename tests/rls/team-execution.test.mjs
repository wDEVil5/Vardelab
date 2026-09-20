import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queryAs, countAs, expectRlsError, SEED } from './client.mjs';

/**
 * Pruebas reales de RLS, tanda 2: hitos, entregas, equipos y roles de
 * proyecto — el corazón del flujo de ejecución (equipo ya seleccionado,
 * trabajando en un proyecto). Mismo arnés que `policies.test.mjs`, ver ese
 * archivo para el mecanismo (`queryAs`, rollback automático).
 *
 * Fixtures usados (de `supabase/seed.sql`): proyecto 001 (`seleccion`,
 * organización de Camila), con el equipo ya confirmado — Valentina es la
 * única integrante. Diego no tiene ninguna relación con este proyecto (es
 * dueño de una organización distinta), así que sirve de "patrocinador
 * ajeno" en todos los casos.
 */

const PROJECT = 'b0000000-0000-0000-0000-000000000001';
const TEAM = 'd0000000-0000-0000-0000-000000000001';
const MILESTONE = 'e0000000-0000-0000-0000-000000000001';

// --- milestones --------------------------------------------------------------

test('un integrante del equipo ve los hitos de su propio proyecto', () => {
  const rows = countAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `select id from public.milestones where id = '${MILESTONE}';`,
  });
  assert.equal(rows, 1);
});

test('quien gestiona el proyecto ve sus hitos', () => {
  const rows = countAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `select id from public.milestones where id = '${MILESTONE}';`,
  });
  assert.equal(rows, 1);
});

test('un patrocinador ajeno (ni gestiona ni integra el equipo) no ve los hitos de un proyecto en selección', () => {
  const rows = countAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `select id from public.milestones where id = '${MILESTONE}';`,
  });
  assert.equal(rows, 0);
});

test('un integrante del equipo no puede crear un hito (solo el gestor)', () => {
  expectRlsError(() => queryAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `insert into public.milestones (project_id, titulo, orden) values ('${PROJECT}', 'Hito falso', 99);`,
  }));
});

test('quien gestiona el proyecto sí puede crear un hito', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `insert into public.milestones (project_id, titulo, orden) values ('${PROJECT}', 'Hito de prueba', 99) returning id;`,
  });
  assert.equal(rows.length, 1);
});

// --- submissions ---------------------------------------------------------
// Sin entregas en el seed: se inserta una fila propia (con id fijo, dentro
// de la misma transacción que después se revierte) para probar lectura y
// borrado sobre ella, cambiando de rol a mitad de la misma transacción.

const SUBMISSION = 'f9000000-0000-0000-0000-000000000001';

test('un integrante del equipo puede entregar en un hito de su proyecto', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `insert into public.submissions (id, milestone_id, submitted_by, url)
          values ('${SUBMISSION}', '${MILESTONE}', '${SEED.VALENTINA}', 'https://github.com/x/y') returning id;`,
  });
  assert.equal(rows.length, 1);
});

test('alguien que no integra el equipo no puede entregar en ese hito', () => {
  expectRlsError(() => queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `insert into public.submissions (id, milestone_id, submitted_by, url)
          values ('${SUBMISSION}', '${MILESTONE}', '${SEED.DIEGO}', 'https://github.com/x/y');`,
  }));
});

test('no se puede entregar a nombre de otra persona (aunque sí integre el equipo)', () => {
  expectRlsError(() => queryAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `insert into public.submissions (id, milestone_id, submitted_by, url)
          values ('${SUBMISSION}', '${MILESTONE}', '${SEED.CAMILA}', 'https://github.com/x/y');`,
  }));
});

test('el autor, el gestor y un integrante ven la entrega; un patrocinador ajeno no', () => {
  const insertYVer = (viewerId) => queryAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `
      insert into public.submissions (id, milestone_id, submitted_by, url)
      values ('${SUBMISSION}', '${MILESTONE}', '${SEED.VALENTINA}', 'https://x');
      set request.jwt.claim.sub = '${viewerId}';
      select id from public.submissions where id = '${SUBMISSION}';
    `,
  });
  assert.deepEqual(insertYVer(SEED.VALENTINA), [SUBMISSION]); // autora
  assert.deepEqual(insertYVer(SEED.CAMILA), [SUBMISSION]); // gestora
  assert.deepEqual(insertYVer(SEED.DIEGO), []); // ajeno
});

test('el gestor puede borrar una entrega aunque no sea suya; un patrocinador ajeno no puede', () => {
  const insertYBorrar = (borradorId) => queryAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `
      insert into public.submissions (id, milestone_id, submitted_by, url)
      values ('${SUBMISSION}', '${MILESTONE}', '${SEED.VALENTINA}', 'https://x');
      set request.jwt.claim.sub = '${borradorId}';
      delete from public.submissions where id = '${SUBMISSION}' returning id;
    `,
  });
  assert.deepEqual(insertYBorrar(SEED.CAMILA), [SUBMISSION]);
  assert.deepEqual(insertYBorrar(SEED.DIEGO), []);
});

// --- teams / team_members -------------------------------------------------

// M86 revocó la lectura pública de teams/team_members (se podía leer la
// tabla directo con la anon key y reconstruir quién quedó seleccionado en
// cada proyecto — sentía injusto para quien postuló y no quedó). Solo
// integrante/gestor/admin la ven.
test('un visitante sin sesión NO ve el equipo de un proyecto', () => {
  const rows = countAs({ role: 'anon', sql: `select id from public.teams where id = '${TEAM}';` });
  assert.equal(rows, 0);
});

test('un visitante sin sesión NO ve los integrantes de un equipo', () => {
  const rows = countAs({
    role: 'anon',
    sql: `select id from public.team_members where team_id = '${TEAM}' and user_id = '${SEED.VALENTINA}';`,
  });
  assert.equal(rows, 0);
});

test('un integrante del equipo sí se ve a sí mismo en team_members', () => {
  const rows = countAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `select id from public.team_members where team_id = '${TEAM}' and user_id = '${SEED.VALENTINA}';`,
  });
  assert.equal(rows, 1);
});

test('un patrocinador ajeno no puede agregar a alguien al equipo de otro gestor', () => {
  expectRlsError(() => queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `insert into public.team_members (team_id, user_id, project_role_id)
          values ('${TEAM}', '${SEED.DIEGO}', '${SEED.ROLE_EN_ORG_CAMILA}');`,
  }));
});

test('un patrocinador ajeno no puede quitar a alguien del equipo de otro gestor', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `delete from public.team_members where team_id = '${TEAM}' returning id;`,
  });
  assert.equal(rows.length, 0);
});

// --- project_roles ---------------------------------------------------------

test('un patrocinador ajeno no puede agregar un rol al proyecto de otro gestor', () => {
  expectRlsError(() => queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `insert into public.project_roles (project_id, nombre, cupos) values ('${PROJECT}', 'Rol falso', 1);`,
  }));
});

test('quien gestiona el proyecto sí puede agregar un rol', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `insert into public.project_roles (project_id, nombre, cupos) values ('${PROJECT}', 'Rol de prueba', 1) returning id;`,
  });
  assert.equal(rows.length, 1);
});
