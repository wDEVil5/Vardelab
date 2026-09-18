import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queryAs, countAs, expectRlsError, SEED } from './client.mjs';

/**
 * Pruebas reales de RLS, tanda 3: evaluaciones, portafolio, leads/reportes
 * (permisos de moderador) y notificaciones. Mismo arnés y mismos fixtures
 * que `policies.test.mjs`/`team-execution.test.mjs` — ver esos archivos.
 *
 * `evaluations`, `portfolio_items`, `leads` y `reports` no tienen filas en
 * el seed: cada prueba inserta la suya propia con un id fijo, dentro de la
 * misma transacción que se revierte al final.
 */

const PROJECT = 'b0000000-0000-0000-0000-000000000001'; // de Camila; Valentina es su única integrante

// --- evaluations -------------------------------------------------------------

const EVALUATION = 'f9000000-0000-0000-0000-000000000002';

test('un patrocinador ajeno no puede evaluar a alguien de un proyecto que no gestiona', () => {
  expectRlsError(() => queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `insert into public.evaluations (id, project_id, evaluatee_id, evaluator_id, puntaje)
          values ('${EVALUATION}', '${PROJECT}', '${SEED.VALENTINA}', '${SEED.DIEGO}', 5);`,
  }));
});

test('no se puede insertar una evaluación a nombre de otro evaluador', () => {
  expectRlsError(() => queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `insert into public.evaluations (id, project_id, evaluatee_id, evaluator_id, puntaje)
          values ('${EVALUATION}', '${PROJECT}', '${SEED.VALENTINA}', '${SEED.DIEGO}', 5);`,
  }));
});

test('quien gestiona el proyecto puede evaluar a un integrante', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `insert into public.evaluations (id, project_id, evaluatee_id, evaluator_id, puntaje)
          values ('${EVALUATION}', '${PROJECT}', '${SEED.VALENTINA}', '${SEED.CAMILA}', 5) returning id;`,
  });
  assert.equal(rows.length, 1);
});

test('la evaluada, quien evaluó y el gestor ven la evaluación; un patrocinador ajeno no', () => {
  const insertYVer = (viewerId) => queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `
      insert into public.evaluations (id, project_id, evaluatee_id, evaluator_id, puntaje)
      values ('${EVALUATION}', '${PROJECT}', '${SEED.VALENTINA}', '${SEED.CAMILA}', 5);
      set request.jwt.claim.sub = '${viewerId}';
      select id from public.evaluations where id = '${EVALUATION}';
    `,
  });
  assert.deepEqual(insertYVer(SEED.VALENTINA), [EVALUATION]); // evaluada
  assert.deepEqual(insertYVer(SEED.CAMILA), [EVALUATION]); // gestora/evaluadora
  assert.deepEqual(insertYVer(SEED.DIEGO), []); // ajeno
});

// --- portfolio_items -----------------------------------------------------

const PORTFOLIO_ITEM = 'f9000000-0000-0000-0000-000000000003';

test('un ítem de portafolio público es visible sin sesión', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `
      insert into public.portfolio_items (id, profile_id, titulo, visibility) values ('${PORTFOLIO_ITEM}', '${SEED.VALENTINA}', 'App de tareas', 'publico');
      set role anon;
      select id from public.portfolio_items where id = '${PORTFOLIO_ITEM}';
    `,
  });
  assert.deepEqual(rows, [PORTFOLIO_ITEM]);
});

test('un ítem de portafolio privado NO es visible para un desconocido', () => {
  // Marcos (moderador puro, sin organización) — a diferencia de Diego, que
  // SÍ "gestiona" a Valentina como postulante (ella también aplicó a un
  // proyecto de la organización de Diego), Marcos no tiene ninguna relación
  // con ella.
  const rows = queryAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `
      insert into public.portfolio_items (id, profile_id, titulo, visibility) values ('${PORTFOLIO_ITEM}', '${SEED.VALENTINA}', 'App de tareas', 'privado');
      set request.jwt.claim.sub = '${SEED.MARCOS}';
      select id from public.portfolio_items where id = '${PORTFOLIO_ITEM}';
    `,
  });
  assert.deepEqual(rows, []);
});

test('un ítem de portafolio privado SÍ es visible para quien gestiona a esa persona como postulante', () => {
  // Camila "gestiona" a Valentina como postulante porque Valentina postuló
  // (y quedó aceptada) a un rol de un proyecto de la organización de Camila
  // — mismo dato de seed que usan las pruebas de postulaciones.
  const rows = queryAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `
      insert into public.portfolio_items (id, profile_id, titulo, visibility) values ('${PORTFOLIO_ITEM}', '${SEED.VALENTINA}', 'App de tareas', 'privado');
      set request.jwt.claim.sub = '${SEED.CAMILA}';
      select id from public.portfolio_items where id = '${PORTFOLIO_ITEM}';
    `,
  });
  assert.deepEqual(rows, [PORTFOLIO_ITEM]);
});

test('no se puede agregar una evidencia de portafolio a nombre de otra persona', () => {
  expectRlsError(() => queryAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `insert into public.portfolio_items (id, profile_id, titulo) values ('${PORTFOLIO_ITEM}', '${SEED.DIEGO}', 'App ajena');`,
  }));
});

// --- leads -----------------------------------------------------------------

const LEAD = 'f9000000-0000-0000-0000-000000000004';

test('cualquiera (sin sesión) puede dejar un lead, siempre en estado "nuevo"', () => {
  // Sin `returning`: `anon` no tiene ninguna policy de SELECT sobre `leads`
  // (la lectura es solo para moderador/admin) — Postgres exige que una fila
  // devuelta por RETURNING también pase una policy de SELECT, así que pedir
  // el id de vuelta acá fallaría por RLS aunque el insert en sí sea válido
  // (mismo motivo por el que `submitLead`, la acción real, tampoco usa
  // `.select()` después de insertar). Se confirma que el insert funcionó
  // haciendo login como moderador, en la misma transacción, y buscándolo.
  const rows = queryAs({
    role: 'anon',
    sql: `
      insert into public.leads (id, tipo, nombre, email, mensaje) values ('${LEAD}', 'contacto_organizacion', 'X', 'x@x.cl', 'Hola');
      set role authenticated;
      set request.jwt.claim.sub = '${SEED.MARCOS}';
      select id from public.leads where id = '${LEAD}';
    `,
  });
  assert.deepEqual(rows, [LEAD]);
});

test('no se puede dejar un lead ya "contactado" (fuerza estado=nuevo)', () => {
  expectRlsError(() => queryAs({
    role: 'anon',
    sql: `insert into public.leads (id, tipo, nombre, email, mensaje, estado) values ('${LEAD}', 'contacto_organizacion', 'X', 'x@x.cl', 'Hola', 'contactado');`,
  }));
});

test('un patrocinador (no es staff) no puede leer los leads', () => {
  const rows = countAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      insert into public.leads (id, tipo, nombre, email, mensaje) values ('${LEAD}', 'contacto_organizacion', 'X', 'x@x.cl', 'Hola');
      select id from public.leads where id = '${LEAD}';
    `,
  });
  assert.equal(rows, 0);
});

test('un moderador sí puede leer y actualizar los leads', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.MARCOS,
    sql: `
      insert into public.leads (id, tipo, nombre, email, mensaje) values ('${LEAD}', 'contacto_organizacion', 'X', 'x@x.cl', 'Hola');
      update public.leads set estado = 'contactado' where id = '${LEAD}' returning id;
    `,
  });
  assert.deepEqual(rows, [LEAD]);
});

// --- reports -----------------------------------------------------------------

const REPORT = 'f9000000-0000-0000-0000-000000000005';

test('no se puede reportar algo a nombre de otra persona', () => {
  expectRlsError(() => queryAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `insert into public.reports (id, reporter_id, target_type, target_id, motivo)
          values ('${REPORT}', '${SEED.DIEGO}', 'perfil', '${SEED.CAMILA}', 'spam');`,
  }));
});

test('quien reportó, y un moderador, ven el reporte; un patrocinador ajeno no', () => {
  const insertYVer = (viewerId) => queryAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `
      insert into public.reports (id, reporter_id, target_type, target_id, motivo)
      values ('${REPORT}', '${SEED.VALENTINA}', 'perfil', '${SEED.CAMILA}', 'spam');
      set request.jwt.claim.sub = '${viewerId}';
      select id from public.reports where id = '${REPORT}';
    `,
  });
  assert.deepEqual(insertYVer(SEED.VALENTINA), [REPORT]); // reportante
  assert.deepEqual(insertYVer(SEED.MARCOS), [REPORT]); // moderador
  assert.deepEqual(insertYVer(SEED.DIEGO), []); // ajeno
});

test('un patrocinador no puede resolver un reporte (solo moderador/admin)', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.VALENTINA,
    sql: `
      insert into public.reports (id, reporter_id, target_type, target_id, motivo)
      values ('${REPORT}', '${SEED.VALENTINA}', 'perfil', '${SEED.CAMILA}', 'spam');
      set request.jwt.claim.sub = '${SEED.DIEGO}';
      update public.reports set status = 'resuelto' where id = '${REPORT}' returning id;
    `,
  });
  assert.equal(rows.length, 0);
});

// --- notifications -----------------------------------------------------------

test('cada quien ve solo sus propias notificaciones', () => {
  const rows = countAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `select id from public.notifications where user_id = '${SEED.DIEGO}';`,
  });
  assert.equal(rows, 0);
});

test('nadie puede marcar como leída una notificación de otra persona', () => {
  const rows = queryAs({
    role: 'authenticated', userId: SEED.CAMILA,
    sql: `update public.notifications set leida = true where user_id = '${SEED.DIEGO}' returning id;`,
  });
  assert.equal(rows.length, 0);
});
