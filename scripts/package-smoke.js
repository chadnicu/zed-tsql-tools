import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const temporary = await mkdtemp(join(tmpdir(), 'tsql package test '));
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run through npm run test:package.');

function run(args, options = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: root, encoding: 'utf8', timeout: 30000, ...options,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

try {
  const [packed] = JSON.parse(run([npmCli, 'pack', '--json', '--ignore-scripts', '--pack-destination', temporary]));
  const paths = packed.files.map(file => file.path);
  for (const path of paths) {
    assert.ok(!/(^|\/)(?:\.env(?:\.|$)|\.git(?:\/|$)|profiles\.json$)|\.(?:pem|key)$/.test(path), `Unexpected package file: ${path}`);
  }
  for (const path of ['bin/format.js', 'bin/lsp.js', 'src/batches.js', 'LICENSE', 'SECURITY.md', 'examples/formatter.json']) {
    assert.ok(paths.includes(path), `Missing package file: ${path}`);
  }
  const prefix = join(temporary, 'installed tools');
  run([npmCli, 'install', '--prefix', prefix, join(temporary, packed.filename),
    '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--cache', join(temporary, 'empty-cache')]);
  const installed = join(prefix, 'node_modules', ...pkg.name.split('/'));
  const settings = JSON.parse(run([join(installed, 'bin/zed-settings.js')], { cwd: temporary }));
  const command = settings.languages.SQL.formatter.external;
  assert.equal(command.command, process.execPath);
  const output = run(command.arguments, { cwd: temporary, input: 'select 1\nGO 2\nselect 3;' });
  assert.match(output, /SELECT 1\nGO 2\nSELECT 3;/);
  const lspSettings = JSON.parse(run([join(installed, 'bin/zed-settings.js'), '--lsp'], { cwd: temporary }));
  assert.equal(lspSettings.languages.SQL.formatter, 'language_server');
  assert.equal(lspSettings.lsp['poor-mans-tsql-lsp'].binary.path, process.execPath);
  assert.equal(lspSettings.lsp['poor-mans-tsql-lsp'].binary.arguments[0], join(installed, 'bin/lsp.js'));
  const queryHelp = run([join(installed, 'bin/query.js'), '--help'], { cwd: temporary });
  assert.match(queryHelp, /Passwords are never stored/);
  console.log(`Package smoke test passed: ${packed.filename}, ${paths.length} files, offline install, paths with spaces.`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
