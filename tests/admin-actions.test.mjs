import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, form } from './helpers.mjs';

const ADMIN = { id: 'admin1', esAdmin: true };
const NO_ADMIN = { id: 'u2', esAdmin: false };

test('una cuenta sin rol de admin no puede cambiar el rol de nadie', async () => {
  const { exports, rpcCalls } = load('features/admin/actions.ts', { currentUser: NO_ADMIN });
  const result = await exports.changeUserRole({}, form({ userId: 'u3', rol: 'moderador' }));
  assert.match(result.error, /No autorizado/);
  assert.equal(rpcCalls.length, 0);
});

test('un admin no puede quitarse su propio rol de administrador', async () => {
  const { exports, rpcCalls } = load('features/admin/actions.ts', { currentUser: ADMIN });
  const result = await exports.changeUserRole({}, form({ userId: 'admin1', rol: 'estudiante' }));
  assert.match(result.error, /propio rol de administrador/);
  assert.equal(rpcCalls.length, 0);
});

test('un rol inválido no se manda a la función atómica', async () => {
  const { exports, rpcCalls } = load('features/admin/actions.ts', { currentUser: ADMIN });
  const result = await exports.changeUserRole({}, form({ userId: 'u3', rol: 'superadmin' }));
  assert.ok(result.error);
  assert.equal(rpcCalls.length, 0);
});

test('cambiar el rol de otro usuario funciona y deja auditoría', async () => {
  const { exports, rpcCalls, queries } = load('features/admin/actions.ts', {
    currentUser: ADMIN,
    rpcResponses: [{ error: null }],
    responses: [{ error: null }], // insert en audit_logs
  });
  const result = await exports.changeUserRole({}, form({ userId: 'u3', rol: 'mentor' }));
  assert.equal(result.error, undefined);
  assert.equal(rpcCalls[0].name, 'set_user_role');
  assert.equal(rpcCalls[0].args._role, 'mentor');
  const auditoria = queries.find((q) => q.table === 'audit_logs');
  assert.ok(auditoria.steps.some(([m, v]) => m === 'insert' && v.accion === 'rol_actualizado'));
});

test('un admin no puede suspender su propia cuenta', async () => {
  const { exports, adminAuthCalls } = load('features/admin/actions.ts', { currentUser: ADMIN });
  const result = await exports.suspendUser({}, form({ userId: 'admin1' }));
  assert.match(result.error, /propia cuenta/);
  assert.equal(adminAuthCalls.length, 0);
});

test('suspender a otro usuario banea la cuenta y deja auditoría', async () => {
  const { exports, adminAuthCalls, queries } = load('features/admin/actions.ts', {
    currentUser: ADMIN,
    adminAuthResponses: [{ error: null }],
    responses: [{ error: null }],
  });
  const result = await exports.suspendUser({}, form({ userId: 'u3' }));
  assert.equal(result.error, undefined);
  assert.equal(adminAuthCalls[0].userId, 'u3');
  assert.ok(adminAuthCalls[0].opts.ban_duration);
  const auditoria = queries.find((q) => q.table === 'audit_logs');
  assert.ok(auditoria.steps.some(([m, v]) => m === 'insert' && v.accion === 'cuenta_suspendida'));
});

test('reactivar una cuenta desbanea (ban_duration: "none")', async () => {
  const { exports, adminAuthCalls } = load('features/admin/actions.ts', {
    currentUser: ADMIN,
    adminAuthResponses: [{ error: null }],
    responses: [{ error: null }],
  });
  const result = await exports.reactivateUser({}, form({ userId: 'u3' }));
  assert.equal(result.error, undefined);
  assert.equal(adminAuthCalls[0].opts.ban_duration, 'none');
});

test('crear una habilidad con nombre repetido no se duplica', async () => {
  const { exports } = load('features/admin/actions.ts', {
    currentUser: ADMIN,
    responses: [{ error: { code: '23505', message: 'duplicate key' } }],
  });
  const result = await exports.createSkill({}, form({ nombre: 'React', categoria: 'Frontend' }));
  assert.match(result.error, /Ya existe una habilidad/);
});

test('activar/desactivar una habilidad deja el motivo correcto en la auditoría', async () => {
  const { exports, queries } = load('features/admin/actions.ts', {
    currentUser: ADMIN,
    responses: [{ error: null }, { error: null }],
  });
  const result = await exports.toggleSkillActivo({}, form({ skillId: 's1', nombre: 'React', activo: 'false' }));
  assert.equal(result.error, undefined);
  const auditoria = queries.find((q) => q.table === 'audit_logs');
  const insert = auditoria.steps.find(([m]) => m === 'insert');
  assert.equal(insert[1].metadata.tipo, 'desactivada');
});

test('renombrar una categoría a un nombre que ya existe pide confirmación en vez de fusionar directo', async () => {
  const { exports } = load('features/admin/actions.ts', {
    currentUser: ADMIN,
    responses: [{ count: 3 }],
  });
  const result = await exports.renameCategoria({}, form({
    categoriaActual: 'Frontend', categoriaNueva: 'Front-end',
  }));
  assert.equal(result.requiereConfirmacion, true);
  assert.match(result.error, /Ya existe la categoría/);
});

test('renombrar una categoría confirmando la fusión sí la aplica', async () => {
  const { exports } = load('features/admin/actions.ts', {
    currentUser: ADMIN,
    responses: [{ error: null }, { error: null }],
  });
  const result = await exports.renameCategoria({}, form({
    categoriaActual: 'Frontend', categoriaNueva: 'Front-end', confirmarFusion: 'true',
  }));
  assert.equal(result.error, undefined);
});

test('renombrar una categoría al mismo nombre no hace nada', async () => {
  const { exports, queries } = load('features/admin/actions.ts', { currentUser: ADMIN });
  const result = await exports.renameCategoria({}, form({
    categoriaActual: 'Frontend', categoriaNueva: 'Frontend',
  }));
  assert.equal(result.error, undefined);
  assert.equal(queries.length, 0);
});

test('la configuración del piloto no se guarda si nada cambió', async () => {
  const { exports, queries } = load('features/admin/actions.ts', {
    currentUser: ADMIN,
    responses: [{
      data: {
        registro_abierto: true, moderacion_previa_obligatoria: false, patrocinadores_externos: false,
        autoaprobacion_proyectos: false, notif_postulacion_recibida: false, notif_hito_proximo_vencer: false,
        notif_respuesta_moderacion: false, notif_resumen_semanal: false,
      },
      error: null,
    }],
  });
  const result = await exports.updatePilotConfig({}, form({ registroAbierto: 'true' }));
  assert.equal(result.error, undefined);
  assert.equal(queries.length, 1); // solo la lectura, ningún update
});

test('la configuración del piloto se guarda cuando algo cambió', async () => {
  const { exports, queries } = load('features/admin/actions.ts', {
    currentUser: ADMIN,
    responses: [
      {
        data: {
          registro_abierto: false, moderacion_previa_obligatoria: false, patrocinadores_externos: false,
          autoaprobacion_proyectos: false, notif_postulacion_recibida: false, notif_hito_proximo_vencer: false,
          notif_respuesta_moderacion: false, notif_resumen_semanal: false,
        },
        error: null,
      },
      { error: null },
      { error: null },
    ],
  });
  const result = await exports.updatePilotConfig({}, form({ registroAbierto: 'true' }));
  assert.equal(result.error, undefined);
  assert.equal(queries.length, 3);
});

test('aprobar la verificación de una organización que ya no está en revisión no la toca', async () => {
  const { exports } = load('features/admin/actions.ts', {
    currentUser: ADMIN,
    responses: [{ data: [], error: null }],
  });
  const result = await exports.approveOrgVerification({}, form({ orgId: 'o1' }));
  assert.match(result.error, /ya no está en revisión/);
});

test('aprobar la verificación de una organización en revisión funciona', async () => {
  const { exports, queries } = load('features/admin/actions.ts', {
    currentUser: ADMIN,
    responses: [
      { data: [{ id: 'o1', nombre: 'Fundación Semilla' }], error: null },
      { error: null },
    ],
  });
  const result = await exports.approveOrgVerification({}, form({ orgId: 'o1' }));
  assert.equal(result.error, undefined);
  const auditoria = queries.find((q) => q.table === 'audit_logs');
  assert.ok(auditoria.steps.some(([m, v]) => m === 'insert' && v.accion === 'organizacion_verificada'));
});

test('rechazar la verificación de una organización en revisión funciona', async () => {
  const { exports } = load('features/admin/actions.ts', {
    currentUser: ADMIN,
    responses: [
      { data: [{ id: 'o1', nombre: 'Fundación Semilla' }], error: null },
      { error: null },
    ],
  });
  const result = await exports.rejectOrgVerification({}, form({ orgId: 'o1' }));
  assert.equal(result.error, undefined);
});
