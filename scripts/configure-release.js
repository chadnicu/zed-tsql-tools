import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

const root = new URL('../', import.meta.url);
const readJson = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const writeJson = (path, value) => writeFile(new URL(path, root), `${JSON.stringify(value, null, 2)}\n`);

try {
  const { values } = parseArgs({ options: {
    github: { type: 'string' }, npm: { type: 'string' }, author: { type: 'string' },
    'enable-downloads': { type: 'boolean' },
  } });
  const pkg = await readJson('package.json');
  const lock = await readJson('package-lock.json');
  const server = await readJson('extension/server.json');

  if (values['enable-downloads']) {
    if (Object.keys(values).length !== 1) throw new Error('Use --enable-downloads separately, after publishing npm.');
    if (!server.npmPackage || server.npmPackage !== pkg.name || server.version !== pkg.version) {
      throw new Error('Configure GitHub/npm metadata first.');
    }
    server.downloadEnabled = true;
    await writeJson('extension/server.json', server);
    console.log(`Adapter will install ${pkg.name}@${pkg.version}. Run check:release -- --gallery before submission.`);
  } else {
    if (!/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(values.github ?? '')) {
      throw new Error('Provide --github OWNER/REPOSITORY.');
    }
    if (!/^@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/.test(values.npm ?? '')) {
      throw new Error('Provide a scoped package with --npm @YOUR_NPM_USERNAME/tsql-tools.');
    }
    if (!values.author?.trim() || /[\x00-\x1f\x7f]/.test(values.author)) {
      throw new Error('Provide --author with your public author name.');
    }
    const url = `https://github.com/${values.github}`;
    pkg.name = values.npm;
    pkg.author = values.author;
    pkg.repository = { type: 'git', url: `${url}.git` };
    pkg.homepage = `${url}#readme`;
    pkg.bugs = { url: `${url}/issues` };
    pkg.publishConfig = { access: 'public' };
    // Metadata configuration does not authorize publication.
    pkg.private = true;
    lock.name = pkg.name;
    lock.packages[''].name = pkg.name;
    lock.packages[''].version = pkg.version;
    let manifest = await readFile(new URL('extension/extension.toml', root), 'utf8');
    manifest = manifest.replace(/^authors = .*$/m, () => `authors = [${JSON.stringify(values.author)}]`);
    manifest = manifest.replace(/^repository = .*\n/gm, '');
    manifest = manifest.replace(/^capabilities = .*$/m, () => `capabilities = [{ kind = "npm:install", package = ${JSON.stringify(pkg.name)} }]`);
    manifest = manifest.replace(/^# Add the public repository URL before registry submission\.\n/m, '');
    manifest = manifest.replace(/^(authors = .*\n)/m, `$1repository = ${JSON.stringify(url)}\n`);
    await writeJson('package.json', pkg);
    await writeJson('package-lock.json', lock);
    await writeJson('extension/server.json', { npmPackage: pkg.name, version: pkg.version, downloadEnabled: false });
    await writeFile(new URL('extension/extension.toml', root), manifest);
    console.log(`Configured ${url} and ${pkg.name}. Publishing and automatic downloads remain disabled.`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
