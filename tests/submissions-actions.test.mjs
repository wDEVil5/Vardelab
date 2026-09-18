import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, form } from './helpers.mjs';

const USER = { id: 'u1' };

test('una entrega sin enlace, nota ni archivo no se guarda', async () => {
  const { exports } = load('features/submissions/actions.ts', { currentUser: USER });
  const result = await exports.addSubmission({}, form({ milestoneId: 'm1', projectId: 'p1' }));
  assert.match(result.error, /al menos un enlace/);
});

test('una entrega con solo un enlace se guarda sin tocar Storage', async () => {
  const { exports, storageUploads, paths } = load('features/submissions/actions.ts', {
    currentUser: USER,
    responses: [{ error: null }],
  });
  const result = await exports.addSubmission({}, form({
    milestoneId: 'm1', projectId: 'p1', url: 'https://github.com/x/y',
  }));
  assert.equal(result.error, undefined);
  assert.equal(storageUploads.length, 0);
  assert.ok(paths.includes('/mis-proyectos/p1'));
});

test('un archivo con formato no admitido se rechaza antes de subir nada', async () => {
  const { exports, storageUploads } = load('features/submissions/actions.ts', { currentUser: USER });
  const archivo = new File(['contenido'], 'virus.exe', { type: 'application/x-msdownload' });
  const result = await exports.addSubmission({}, form({ milestoneId: 'm1', projectId: 'p1', archivo }));
  assert.match(result.error, /Formato no admitido/);
  assert.equal(storageUploads.length, 0);
});

test('un archivo de más de 20 MB se rechaza antes de subir nada', async () => {
  const { exports, storageUploads } = load('features/submissions/actions.ts', { currentUser: USER });
  const grande = new Uint8Array(20 * 1024 * 1024 + 1);
  const archivo = new File([grande], 'grande.pdf', { type: 'application/pdf' });
  const result = await exports.addSubmission({}, form({ milestoneId: 'm1', projectId: 'p1', archivo }));
  assert.match(result.error, /20 MB/);
  assert.equal(storageUploads.length, 0);
});

test('si falla el insert después de subir el archivo, el archivo se borra (no queda huérfano)', async () => {
  const { exports, storageUploads, storageRemoves } = load('features/submissions/actions.ts', {
    currentUser: USER,
    responses: [{ error: { message: 'fila inválida' } }],
  });
  const archivo = new File(['contenido'], 'informe.pdf', { type: 'application/pdf' });
  const result = await exports.addSubmission({}, form({ milestoneId: 'm1', projectId: 'p1', archivo }));
  assert.match(result.error, /No se pudo registrar/);
  assert.equal(storageUploads.length, 1);
  assert.equal(storageRemoves.length, 1);
  assert.equal(storageRemoves[0].paths[0], storageUploads[0].path);
});

test('un archivo válido que sí se guarda no dispara ninguna limpieza', async () => {
  const { exports, storageUploads, storageRemoves } = load('features/submissions/actions.ts', {
    currentUser: USER,
    responses: [{ error: null }],
  });
  const archivo = new File(['contenido'], 'informe.pdf', { type: 'application/pdf' });
  const result = await exports.addSubmission({}, form({ milestoneId: 'm1', projectId: 'p1', archivo }));
  assert.equal(result.error, undefined);
  assert.equal(storageUploads.length, 1);
  assert.equal(storageRemoves.length, 0);
});

test('eliminar una entrega con archivo también borra el archivo de Storage', async () => {
  const { exports, storageRemoves } = load('features/submissions/actions.ts', {
    responses: [
      { data: { archivo_url: 'p1/m1/123-informe.pdf' } }, // select
      { error: null },                                     // delete
    ],
  });
  const result = await exports.deleteSubmission({}, form({ submissionId: 's1', projectId: 'p1' }));
  assert.equal(result.error, undefined);
  assert.equal(storageRemoves.length, 1);
  assert.equal(storageRemoves[0].paths[0], 'p1/m1/123-informe.pdf');
});

test('eliminar una entrega sin archivo no toca Storage', async () => {
  const { exports, storageRemoves } = load('features/submissions/actions.ts', {
    responses: [
      { data: { archivo_url: null } },
      { error: null },
    ],
  });
  const result = await exports.deleteSubmission({}, form({ submissionId: 's1', projectId: 'p1' }));
  assert.equal(result.error, undefined);
  assert.equal(storageRemoves.length, 0);
});

test('si falla el borrado de la fila, no se intenta borrar el archivo', async () => {
  const { exports, storageRemoves } = load('features/submissions/actions.ts', {
    responses: [
      { data: { archivo_url: 'p1/m1/123-informe.pdf' } },
      { error: { message: 'no autorizado' } },
    ],
  });
  const result = await exports.deleteSubmission({}, form({ submissionId: 's1', projectId: 'p1' }));
  assert.ok(result.error);
  assert.equal(storageRemoves.length, 0);
});
