import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const readJson = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));

try {
  const pkg = await readJson('package.json');
  const lock = await readJson('package-lock.json');
  const server = await readJson('extension/server.json');
  const manifest = await readFile(new URL('extension/extension.toml', root), 'utf8');
  const requirements = [
    [/^@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/.test(pkg.name), 'Configure the scoped npm package.'],
    [Boolean(pkg.repository?.url?.startsWith('https://github.com/')), 'Configure the GitHub repository.'],
    [server.npmPackage === pkg.name && server.version === pkg.version, 'Synchronize extension/server.json with package.json.'],
    [lock.name === pkg.name && lock.packages[''].version === pkg.version, 'Regenerate package-lock.json.'],
    [manifest.includes(`version = "${pkg.version}"`), 'Synchronize the extension version.'],
    [manifest.includes(`package = "${pkg.name}"`), 'Scope the npm installation capability to this package.'],
    [Boolean(pkg.repository?.url) && manifest.includes(`repository = "${pkg.repository.url.replace(/\.git$/, '')}"`), 'Synchronize the extension repository.'],
  ];
  if (process.argv.includes('--gallery')) requirements.push([server.downloadEnabled === true, 'Enable downloads after publishing npm.']);
  const failures = requirements.filter(([ok]) => !ok).map(([, message]) => message);
  if (failures.length) throw new Error(failures.join('\n'));
  console.log('Release metadata checks passed. Confirm CI and manual acceptance checks separately.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
