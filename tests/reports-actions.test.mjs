import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, form } from './helpers.mjs';

const USER = { id: 'u1' };
const SIN_ORGS = { '@/features/organizations/queries': { getMyOrgIds: async () => [] } };

test('no se puede reportar el propio perfil', async () => {
  const { exports } = load('features/reports/actions.ts', {
    currentUser: USER,
    extraModules: SIN_ORGS,
  });
  const result = await exports.submitReport({}, form({
    targetType: 'perfil', targetId: 'u1', motivo: 'spam',
  }));
  assert.match(result.error, /propio perfil/);
});

test('no se puede reportar la propia organización', async () => {
  const { exports } = load('features/reports/actions.ts', {
    currentUser: USER,
    extraModules: { '@/features/organizations/queries': { getMyOrgIds: async () => ['o1'] } },
  });
  const result = await exports.submitReport({}, form({
    targetType: 'organizacion', targetId: 'o1', motivo: 'spam',
  }));
  assert.match(result.error, /propia organización/);
});

test('no se puede reportar el propio proyecto', async () => {
  const { exports } = load('features/reports/actions.ts', {
    currentUser: USER,
    extraModules: { '@/features/organizations/queries': { getMyOrgIds: async () => ['o1'] } },
    responses: [{ data: { org_id: 'o1' } }],
  });
  const result = await exports.submitReport({}, form({
    targetType: 'proyecto', targetId: 'p1', motivo: 'spam',
  }));
  assert.match(result.error, /propio proyecto/);
});

test('reportar el perfil de otra persona funciona', async () => {
  const { exports } = load('features/reports/actions.ts', {
    currentUser: USER,
    extraModules: SIN_ORGS,
    responses: [{ error: null }],
  });
  const result = await exports.submitReport({}, form({
    targetType: 'perfil', targetId: 'otro-usuario', motivo: 'spam',
  }));
  assert.equal(result.ok, true);
});

test('marcar en revisión un reporte ya resuelto no lo reabre', async () => {
  const { exports } = load('features/reports/actions.ts', {
    responses: [{ data: [], error: null }],
  });
  const result = await exports.markReportInReview({}, form({ reportId: 'r1' }));
  assert.ok(result.error);
});

test('resolver un reporte sin nota no se permite', async () => {
  const { exports } = load('features/reports/actions.ts');
  const result = await exports.resolveReport({}, form({ reportId: 'r1', resolucion: '' }));
  assert.match(result.error, /Deja una nota/);
});

test('resolver un reporte con nota funciona', async () => {
  const { exports } = load('features/reports/actions.ts', {
    responses: [{ data: [{ id: 'r1' }], error: null }],
  });
  const result = await exports.resolveReport({}, form({ reportId: 'r1', resolucion: 'Se contactó a la organización.' }));
  assert.equal(result.error, undefined);
});
