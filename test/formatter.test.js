import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { formatSql } from '../src/formatter.js';

const cli = fileURLToPath(new URL('../bin/format.js', import.meta.url));

test('formats stored procedures and GO batches without losing literals or comments', () => {
  const sql = "create procedure dbo.Example @id int as begin\n-- keep this\nselect N'Ștefan' as name, 'it''s fine' as note where @id=1; end\nGO\nselect 2;";
  const result = formatSql(sql);
  for (const part of ['CREATE PROCEDURE', '-- keep this', "N'Ștefan'", "'it''s fine'", 'GO', 'SELECT 2']) {
    assert.ok(result.includes(part), part);
  }
  assert.equal(formatSql(result), result);
});

test('preserves multiline string content including CRLF', () => {
  assert.ok(formatSql("select 'first\r\nsecond' as value;").includes("'first\r\nsecond'"));
});

test('honors options and preserves empty input', () => {
  assert.match(formatSql('select 1, 2;', { uppercaseKeywords: false }), /select/);
  assert.equal(formatSql(''), '');
  assert.equal(formatSql(' \r\n'), ' \r\n');
  assert.throws(() => formatSql('select 1', { typo: true }), /Invalid formatter option/);
});

test('CLI produces SQL only; malformed SQL fails without stdout', () => {
  const good = spawnSync(process.execPath, [cli], { input: 'select 1;', encoding: 'utf8' });
  assert.ifError(good.error);
  assert.equal(good.status, 0, good.stderr);
  assert.equal(good.stderr, '');
  assert.match(good.stdout, /SELECT 1/);
  const bad = spawnSync(process.execPath, [cli], { input: "select 'unfinished", encoding: 'utf8' });
  assert.ifError(bad.error);
  assert.equal(bad.status, 1);
  assert.equal(bad.stdout, '');
  assert.match(bad.stderr, /could not parse/);
});

test('CLI reads explicit config from paths with spaces and rejects invalid config', async t => {
  const { mkdtemp, writeFile, rm } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const { tmpdir } = await import('node:os');
  const dir = await mkdtemp(join(tmpdir(), 'formatter config '));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'style options.json');
  await writeFile(path, JSON.stringify({ uppercaseKeywords: false }));
  const run = () => spawnSync(process.execPath, [cli, '--config', path], { input: 'select 1;', encoding: 'utf8' });
  const good = run();
  assert.ifError(good.error);
  assert.equal(good.status, 0, good.stderr);
  assert.match(good.stdout, /select 1/);
  await writeFile(path, '{bad json');
  const bad = run();
  assert.equal(bad.status, 1);
  assert.equal(bad.stdout, '');
});
