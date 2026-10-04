import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queryAs, expectError, SEED } from './client.mjs';

// Auditoría de la propiedad de organizaciones (M108): la RLS de `organizations`
// no distingue columnas, así que `owner_id` queda protegido por trigger, y la
// membresía solo la modifica el dueño, no cualquier miembro.
//
// Cada prueba crea su propia organización dentro de la transacción, sin tocar
// filas del seed ni de otros archivos que corren en paralelo.

const ORG_PRUEBA = 'a0000000-0000-0000-0000-0000000000f3';

const CREAR_ORG = `
  insert into public.organizations (id, owner_id, nombre, tipo)
  values ('${ORG_PRUEBA}', '${SEED.DIEGO}', 'Organización de seguridad', 'social');
`;

const MEMBRESIA_VALENTINA = `
  insert into public.organization_members (org_id, user_id, invited_email, status, invited_by)
  values ('${ORG_PRUEBA}', '${SEED.VALENTINA}', 'estudiante@demo.cl', 'activo', '${SEED.DIEGO}');
`;

test('un miembro activo no puede apropiarse de la organización cambiando owner_id directo', () => {
  expectError(
    () => queryAs({
      role: 'authenticated', userId: SEED.DIEGO,
      sql: `
        ${CREAR_ORG}
        ${MEMBRESIA_VALENTINA}
        set request.jwt.claim.sub = '${SEED.VALENTINA}';
        update public.organizations set owner_id = '${SEED.VALENTINA}' where id = '${ORG_PRUEBA}';
      `,
    }),
    /solo se transfiere/,
  );
});

test('ni siquiera el dueño puede cambiar owner_id directo: pasa por transfer_organization_ownership', () => {
  expectError(
    () => queryAs({
      role: 'authenticated', userId: SEED.DIEGO,
      sql: `
        ${CREAR_ORG}
        ${MEMBRESIA_VALENTINA}
        update public.organizations set owner_id = '${SEED.VALENTINA}' where id = '${ORG_PRUEBA}';
      `,
    }),
    /solo se transfiere/,
  );
});

test('un miembro no puede activar una invitación pendiente que no es suya', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      insert into public.organization_members (org_id, user_id, invited_email, status, invited_by)
      values ('${ORG_PRUEBA}', null, 'otra@demo.cl', 'pendiente', '${SEED.DIEGO}');
      ${MEMBRESIA_VALENTINA}
      set request.jwt.claim.sub = '${SEED.VALENTINA}';
      update public.organization_members set status = 'activo', user_id = '${SEED.VALENTINA}'
        where org_id = '${ORG_PRUEBA}' and invited_email = 'otra@demo.cl' returning id;
    `,
  });
  assert.deepEqual(salida, []);
});

test('el dueño sigue pudiendo editar los datos de su organización', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      update public.organizations set descripcion = 'Descripción de prueba' where id = '${ORG_PRUEBA}' returning id;
    `,
  });
  assert.deepEqual(salida, [ORG_PRUEBA]);
});

test('un miembro activo sigue pudiendo editar los datos de la organización (decisión M38)', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      ${MEMBRESIA_VALENTINA}
      set request.jwt.claim.sub = '${SEED.VALENTINA}';
      update public.organizations set descripcion = 'Editada por miembro' where id = '${ORG_PRUEBA}' returning id;
    `,
  });
  assert.deepEqual(salida, [ORG_PRUEBA]);
});
