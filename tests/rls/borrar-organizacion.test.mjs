import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queryAs, SEED } from './client.mjs';

// M107: solo el dueño (o un admin) borra una organización. La RLS de delete
// filtra en silencio: si la política no deja, el delete devuelve cero filas en
// vez de error. Por eso se verifica con `returning`.
//
// Cada prueba crea su propia organización dentro de la transacción, así no
// depende de quién sea el dueño de la organización del seed en ese momento.

const ORG_PRUEBA = 'a0000000-0000-0000-0000-0000000000f1';

const CREAR_ORG = `
  insert into public.organizations (id, owner_id, nombre, tipo)
  values ('${ORG_PRUEBA}', '${SEED.DIEGO}', 'Organización de prueba', 'social');
`;

test('un miembro activo que no es dueño no puede borrar la organización', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      insert into public.organization_members (org_id, user_id, invited_email, status, invited_by)
      values ('${ORG_PRUEBA}', '${SEED.VALENTINA}', 'estudiante@demo.cl', 'activo', '${SEED.DIEGO}');
      set request.jwt.claim.sub = '${SEED.VALENTINA}';
      delete from public.organizations where id = '${ORG_PRUEBA}' returning id;
    `,
  });
  assert.deepEqual(salida, []);
});

test('el dueño sí puede borrar la organización', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      delete from public.organizations where id = '${ORG_PRUEBA}' returning id;
    `,
  });
  assert.deepEqual(salida, [ORG_PRUEBA]);
});

test('un admin puede borrar cualquier organización', () => {
  const salida = queryAs({
    role: 'authenticated', userId: SEED.DIEGO,
    sql: `
      ${CREAR_ORG}
      set request.jwt.claim.sub = '${SEED.ADMIN}';
      delete from public.organizations where id = '${ORG_PRUEBA}' returning id;
    `,
  });
  assert.deepEqual(salida, [ORG_PRUEBA]);
});
