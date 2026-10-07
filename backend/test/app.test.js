const { test } = require('node:test');
const assert = require('node:assert');
const { once } = require('node:events');
const fs = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');
const repository = require('../src/repositories/documentRepository');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('contratos HTTP dos documentos', async (context) => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const owner = `test-${Date.now()}`;
  const storageDirectory = path.join(__dirname, '../storage');
  const initialFiles = new Set(await fs.readdir(storageDirectory));
  context.after(async () => {
    const files = await fs.readdir(storageDirectory);
    await Promise.all(files.filter((name) => !initialFiles.has(name))
      .map((name) => fs.unlink(path.join(storageDirectory, name))));
  });
  const request = (route, options = {}) => fetch(`${baseUrl}${route}`, {
    ...options,
    headers: { 'X-User-Id': owner, ...options.headers }
  });
  const upload = (content, name = 'relatorio.pdf', type = 'application/pdf') => {
    const body = new FormData();
    body.append('file', new Blob([content], { type }), name);
    return request('/upload', { method: 'POST', body });
  };
  let document;

  await context.test('saude continua disponivel', async () => {
    const response = await fetch(`${baseUrl}/health`);
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(await response.json(), { status: 'ok' });
  });

  await context.test('exige identidade em todas as rotas', async () => {
    for (const [route, method] of [
      ['/documents', 'GET'], ['/upload', 'POST'], ['/documents/missing/download', 'GET']
    ]) {
      const response = await fetch(`${baseUrl}${route}`, { method });
      assert.strictEqual(response.status, 401);
      assert.strictEqual(typeof (await response.json()).error.code, 'string');
    }
    const blank = await request('/documents', { headers: { 'X-User-Id': '   ' } });
    assert.strictEqual(blank.status, 401);
    const response = await request('/documents', { headers: { 'X-User-Id': 'a'.repeat(129) } });
    assert.strictEqual(response.status, 400);
  });

  await context.test('lista vazia para usuario sem documentos', async () => {
    const response = await request('/documents');
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(await response.json(), { documents: [] });
  });

  await context.test('upload grava arquivo local e retorna somente metadados publicos', async () => {
    const response = await upload('%PDF-1.7 documento');
    assert.strictEqual(response.status, 201);
    ({ document } = await response.json());
    assert.deepStrictEqual(Object.keys(document).sort(), ['id', 'originalName', 'owner', 'size', 'uploadedAt']);
    assert.match(document.id, /^[0-9a-f-]{36}$/);
    assert.strictEqual(document.originalName, 'relatorio.pdf');
    assert.strictEqual(document.owner, owner);
    assert.strictEqual(document.size, Buffer.byteLength('%PDF-1.7 documento'));
    assert.ok(Number.isFinite(Date.parse(document.uploadedAt)));
    const files = (await fs.readdir(storageDirectory)).filter((name) => !initialFiles.has(name));
    assert.strictEqual(files.length, 1);
    assert.notStrictEqual(files[0], document.originalName);
    assert.strictEqual(await fs.readFile(path.join(storageDirectory, files[0]), 'utf8'), '%PDF-1.7 documento');
  });

  await context.test('lista e baixa somente documentos do dono', async () => {
    assert.ok(document);
    const list = await request('/documents');
    assert.deepStrictEqual(await list.json(), { documents: [document] });
    const response = await request(`/documents/${document.id}/download`);
    assert.strictEqual(response.status, 200);
    assert.match(response.headers.get('content-disposition'), /attachment;.*relatorio\.pdf/);
    assert.match(response.headers.get('content-type'), /application\/pdf/);
    assert.strictEqual(await response.text(), '%PDF-1.7 documento');
    const otherList = await request('/documents', { headers: { 'X-User-Id': 'outro' } });
    assert.deepStrictEqual(await otherList.json(), { documents: [] });
    const forbidden = await request(`/documents/${document.id}/download`, { headers: { 'X-User-Id': 'outro' } });
    const missing = await request('/documents/inexistente/download');
    assert.strictEqual(forbidden.status, 404);
    assert.strictEqual(missing.status, 404);
    assert.deepStrictEqual(await forbidden.json(), await missing.json());
  });

  await context.test('rejeita uploads invalidos sem deixar arquivos ou metadados', async () => {
    const before = (await fs.readdir(storageDirectory)).sort();
    const noFile = await request('/upload', { method: 'POST', body: new FormData() });
    assert.strictEqual(noFile.status, 400);
    const extraField = new FormData();
    extraField.append('file', new Blob(['pdf'], { type: 'application/pdf' }), 'extra.pdf');
    extraField.append('metadata', 'unexpected');
    const extraFieldResponse = await request('/upload', { method: 'POST', body: extraField });
    assert.strictEqual(extraFieldResponse.status, 400);
    const empty = await upload('');
    assert.strictEqual(empty.status, 400);
    const unsupported = await upload('texto', 'documento.txt', 'text/plain');
    assert.strictEqual(unsupported.status, 415);
    const mismatch = await upload('texto', 'documento.pdf', 'image/png');
    assert.strictEqual(mismatch.status, 415);
    const tooLarge = await upload(Buffer.alloc(10 * 1024 * 1024 + 1));
    assert.strictEqual(tooLarge.status, 413);
    const multiple = new FormData();
    multiple.append('file', new Blob(['pdf'], { type: 'application/pdf' }), 'um.pdf');
    multiple.append('file', new Blob(['pdf'], { type: 'application/pdf' }), 'dois.pdf');
    const multipleResponse = await request('/upload', { method: 'POST', body: multiple });
    assert.strictEqual(multipleResponse.status, 400);
    assert.deepStrictEqual((await fs.readdir(storageDirectory)).sort(), before);
    const list = await request('/documents');
    assert.deepStrictEqual(await list.json(), { documents: [document] });
  });

  await context.test('falha nos metadados remove arquivo e retorna erro generico', async (subcontext) => {
    const before = (await fs.readdir(storageDirectory)).sort();
    subcontext.mock.method(repository, 'save', () => {
      throw new Error('Detalhes internos que nao devem ser expostos.');
    });
    const response = await upload('pdf');
    assert.strictEqual(response.status, 500);
    assert.deepStrictEqual(await response.json(), {
      error: { code: 'INTERNAL_ERROR', message: 'Nao foi possivel concluir a operacao.' }
    });
    assert.deepStrictEqual((await fs.readdir(storageDirectory)).sort(), before);
    const list = await request('/documents');
    assert.deepStrictEqual(await list.json(), { documents: [document] });
  });

  await context.test('falha de escrita retorna 500 sem registrar documento', async (subcontext) => {
    subcontext.mock.method(fs, 'mkdir', async () => {
      throw Object.assign(new Error('Destino indisponivel'), { code: 'ENOENT' });
    });
    const response = await upload('pdf');
    assert.strictEqual(response.status, 500);
    assert.strictEqual((await response.json()).error.code, 'INTERNAL_ERROR');
    const list = await request('/documents');
    assert.deepStrictEqual(await list.json(), { documents: [document] });
  });

  await context.test('falha inesperada de leitura retorna 500 sem expor caminhos', async (subcontext) => {
    assert.ok(document);
    subcontext.mock.method(fs, 'stat', async () => {
      throw Object.assign(new Error('/caminho/interno'), { code: 'EACCES' });
    });
    const response = await request(`/documents/${document.id}/download`);
    assert.strictEqual(response.status, 500);
    assert.deepStrictEqual(await response.json(), {
      error: { code: 'INTERNAL_ERROR', message: 'Nao foi possivel concluir a operacao.' }
    });
  });

  await context.test('aceita exatamente 10 MiB', async () => {
    const response = await upload(Buffer.alloc(10 * 1024 * 1024), 'limite.pdf');
    assert.strictEqual(response.status, 201);
    assert.strictEqual((await response.json()).document.size, 10 * 1024 * 1024);
  });

  await context.test('arquivo ausente no disco resulta em 404 JSON', async () => {
    assert.ok(document);
    const files = (await fs.readdir(storageDirectory)).filter((name) => !initialFiles.has(name));
    for (const name of files) await fs.unlink(path.join(storageDirectory, name));
    const response = await request(`/documents/${document.id}/download`);
    assert.strictEqual(response.status, 404);
    assert.strictEqual(typeof (await response.json()).error.message, 'string');
  });

  await context.test('repository rejeita nomes internos que escapam do storage', async () => {
    await assert.rejects(repository.locateFile('../README.md'), { code: 'INVALID_STORED_NAME' });
  });
});
