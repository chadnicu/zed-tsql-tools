import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { createMessageConnection, StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc/node.js';

test('LSP formats unsaved Unicode documents, follows edits, and rejects malformed SQL', { timeout: 10000 }, async t => {
  const child = spawn(process.execPath, [fileURLToPath(new URL('../bin/lsp.js', import.meta.url))], { stdio: ['pipe', 'pipe', 'pipe'] });
  const exited = once(child, 'exit');
  let stderr = '';
  child.stderr.setEncoding('utf8').on('data', text => { stderr += text; });
  const connection = createMessageConnection(new StreamMessageReader(child.stdout), new StreamMessageWriter(child.stdin));
  t.after(() => { connection.dispose(); child.kill(); });
  connection.listen();
  const init = await connection.sendRequest('initialize', {
    processId: process.pid, capabilities: {}, rootUri: null,
    initializationOptions: { formatter: { trailingCommas: false, spaceAfterExpandedComma: true } },
  });
  assert.equal(init.capabilities.documentFormattingProvider, true);
  await connection.sendNotification('initialized', {});
  const uri = 'untitled:example.sql';
  const sql = "select N'Ștefan 😀' as name, 2 as value;";
  await connection.sendNotification('textDocument/didOpen', { textDocument: { uri, languageId: 'sql', version: 1, text: sql } });
  const format = () => connection.sendRequest('textDocument/formatting', {
    textDocument: { uri }, options: { tabSize: 4, insertSpaces: true },
  });
  const edits = await format();
  assert.equal(edits.length, 1);
  assert.equal(edits[0].range.end.character, sql.length);
  assert.match(edits[0].newText, /SELECT N'Ștefan 😀'/);
  assert.match(edits[0].newText, /\n {4}, 2 AS value/);
  await connection.sendNotification('textDocument/didChange', {
    textDocument: { uri, version: 2 }, contentChanges: [{ text: 'select 1\nGO 2\nselect 3;' }],
  });
  const batches = await format();
  assert.match(batches[0].newText, /SELECT 1\nGO 2\nSELECT 3;/);
  assert.deepEqual(batches[0].range.end, { line: 2, character: 9 });
  await connection.sendNotification('textDocument/didChange', {
    textDocument: { uri, version: 3 }, contentChanges: [{ text: "select 'broken" }],
  });
  await assert.rejects(format(), /could not parse/);
  await connection.sendNotification('textDocument/didChange', {
    textDocument: { uri, version: 4 }, contentChanges: [{ text: edits[0].newText }],
  });
  assert.deepEqual(await format(), []);
  await connection.sendRequest('shutdown');
  await connection.sendNotification('exit');
  const [code] = await exited;
  assert.equal(code, 0, stderr);
  assert.equal(stderr, '');
});
