import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

for (const newline of ['\n', '\r\n']) {
  test(`release setup synchronizes metadata (${newline === '\n' ? 'LF' : 'CRLF'})`, async t => {
    const directory = await mkdtemp(join(tmpdir(), 'tsql release '));
    t.after(() => rm(directory, { recursive: true, force: true }));
    await mkdir(join(directory, 'scripts'));
    await mkdir(join(directory, 'extension'));
    for (const file of ['scripts/configure-release.js', 'scripts/check-release.js', 'package.json', 'package-lock.json', 'extension/extension.toml', 'extension/server.json']) {
      await copyFile(new URL(`../${file}`, import.meta.url), join(directory, file));
    }
    const manifestPath = join(directory, 'extension/extension.toml');
    await writeFile(manifestPath, (await readFile(manifestPath, 'utf8')).replace(/\r?\n/g, newline));
    const run = (script, args = []) => {
      const result = spawnSync(process.execPath, [join(directory, 'scripts', script), ...args], { cwd: tmpdir(), encoding: 'utf8' });
      assert.ifError(result.error);
      return result;
    };
    const setup = run('configure-release.js', ['--github', 'example/zed-tsql-tools', '--npm', '@example/tsql-tools', '--author', 'Example Maintainer']);
    assert.equal(setup.status, 0, setup.stderr);
    const pkg = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
    const server = JSON.parse(await readFile(join(directory, 'extension/server.json'), 'utf8'));
    assert.equal(pkg.private, true);
    assert.equal(pkg.name, '@example/tsql-tools');
    assert.equal(server.downloadEnabled, false);
    const check = run('check-release.js');
    assert.equal(check.status, 0, check.stderr);
    assert.equal(run('check-release.js', ['--gallery']).status, 1);
    assert.equal(run('configure-release.js', ['--enable-downloads']).status, 0);
    assert.equal(run('check-release.js', ['--gallery']).status, 0);
    const before = await readFile(join(directory, 'package.json'), 'utf8');
    assert.equal(run('configure-release.js', ['--github', '../bad', '--npm', '@example/tsql-tools', '--author', 'Example']).status, 1);
    assert.equal(await readFile(join(directory, 'package.json'), 'utf8'), before);
  });
}
