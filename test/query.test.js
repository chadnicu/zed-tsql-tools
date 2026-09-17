import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { addProfile, readProfiles, validateProfile } from '../src/profiles.js';
import { queryCommand, runQuery } from '../src/query.js';

const profile = { server: 'localhost,1433', database: 'My Database', auth: 'sql', user: 'dev', passwordEnv: 'DB_PASSWORD' };
const cli = fileURLToPath(new URL('../bin/query.js', import.meta.url));

test('rejects terminal control sequences in stored connection metadata', async t => {
  assert.throws(() => validateProfile({ ...profile, server: '\x1b[2Jlocalhost' }), /valid server/);
  assert.throws(() => validateProfile({ ...profile, user: 'user\tspoof' }), /requires a user/);
  const directory = await mkdtemp(join(tmpdir(), 'tsql invalid profile '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, 'profiles.json');
  await writeFile(path, JSON.stringify({ ['dev\x1b[2J']: profile }));
  await assert.rejects(readProfiles(path), /Profile names/);
});

test('cancellation exits with a failure status and removes signal listeners', async () => {
  const before = process.listenerCount('SIGINT');
  const running = runQuery(process.execPath, { args: ['-e', 'setInterval(() => {}, 1000)'], env: process.env });
  process.emit('SIGINT');
  assert.equal(await running, 130);
  assert.equal(process.listenerCount('SIGINT'), before);
});

test('cancellation terminates a client that ignores SIGINT', { skip: process.platform === 'win32', timeout: 6000 }, async t => {
  const directory = await mkdtemp(join(tmpdir(), 'tsql cancellation '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const ready = join(directory, 'ready');
  const script = `process.on('SIGINT', () => {}); require('node:fs').writeFileSync(${JSON.stringify(ready)}, 'ready'); setInterval(() => {}, 1000);`;
  const running = runQuery(process.execPath, { args: ['-e', script], env: process.env });
  let started = false;
  try {
    for (let attempt = 0; attempt < 100; attempt++) {
      try { await readFile(ready); started = true; break; }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      await delay(20);
    }
    assert.ok(started, 'Child did not become ready');
  } finally {
    process.emit('SIGINT');
    assert.equal(await running, 130);
  }
});

test('profiles persist, never save secrets, and reject duplicate names and password fields', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'mssql profiles '));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'nested', 'profiles.json');
  await addProfile(path, 'dev', profile);
  assert.deepEqual((await readProfiles(path)).dev, profile);
  await assert.rejects(addProfile(path, 'dev', { ...profile, database: 'other' }), /already exists/);
  await assert.rejects(addProfile(path, 'bad', { ...profile, password: 'secret' }), /Unknown profile field/);
  assert.equal((await readProfiles(path)).dev.database, 'My Database');
});

test('query arguments preserve paths and password uses environment, not arguments', () => {
  const path = 'C:\\SQL scripts\\example.sql';
  const command = queryCommand(profile, path, {
    PATH: '/bin', DB_PASSWORD: 'secret; $(x)', SQLCMDSERVER: 'wrong', SQLCMDDBNAME: 'wrong', SQLCMDPASSWORD: 'wrong',
  });
  assert.ok(command.args.includes('My Database'));
  assert.equal(command.args.at(-1), path);
  assert.equal(command.env.SQLCMDPASSWORD, 'secret; $(x)');
  assert.equal(command.env.SQLCMDSERVER, undefined);
  assert.equal(command.env.SQLCMDDBNAME, undefined);
  assert.ok(!command.args.join(' ').includes('secret'));
  assert.ok(command.args.includes('-b'));
  assert.ok(!command.args.includes('-C'));
  assert.throws(() => queryCommand(profile, path, {}), /Set DB_PASSWORD/);
});

test('integrated auth discards inherited SQLCMD credentials and supports explicit certificate trust', () => {
  const command = queryCommand({ server: 'localhost', database: 'db', auth: 'integrated', trustServerCertificate: true }, '/query.sql', { SQLCMDPASSWORD: 'secret' });
  assert.ok(command.args.includes('-E'));
  assert.ok(command.args.includes('-C'));
  assert.equal(command.env.SQLCMDPASSWORD, undefined);
});

test('child exit status propagates and missing sqlcmd is actionable', async () => {
  assert.equal(await runQuery(process.execPath, { args: ['-e', 'process.exit(7)'], env: process.env }), 7);
  await assert.rejects(runQuery(join(tmpdir(), 'nonexistent-sqlcmd-for-test'), { args: [], env: process.env }), /sqlcmd not found/);
});

test('CLI adds and lists a profile with spaces and fails before executing with missing password', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'mssql cli '));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'profiles.json');
  const run = args => {
    const result = spawnSync(process.execPath, [cli, ...args, '--profiles', path], { encoding: 'utf8', env: { ...process.env, MSSQL_TEST_MISSING_SECRET: '' } });
    assert.ifError(result.error);
    return result;
  };
  const add = run(['add', 'dev', '--server', 'localhost', '--database', 'My Database', '--user', 'dev', '--password-env', 'MSSQL_TEST_MISSING_SECRET']);
  assert.equal(add.status, 0, add.stderr);
  assert.match(run(['list']).stdout, /My Database/);
  const file = join(dir, 'query file.sql');
  await writeFile(file, 'SELECT 1;');
  const result = run(['run', 'dev', file]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Set MSSQL_TEST_MISSING_SECRET/);
  assert.equal(await readFile(file, 'utf8'), 'SELECT 1;');
  const zed = spawnSync(process.execPath, [cli, 'run', 'dev', '--zed-file', '--profiles', path], {
    encoding: 'utf8', env: { ...process.env, ZED_FILE: file, MSSQL_TEST_MISSING_SECRET: '' },
  });
  assert.ifError(zed.error);
  assert.equal(zed.status, 1);
  assert.match(zed.stderr, /Set MSSQL_TEST_MISSING_SECRET/);
});
