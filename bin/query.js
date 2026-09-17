#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { stat } from 'node:fs/promises';
import { addProfile, defaultProfilesPath, readProfiles } from '../src/profiles.js';
import { queryCommand, runQuery } from '../src/query.js';

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    profiles: { type: 'string' }, server: { type: 'string' }, database: { type: 'string' },
    user: { type: 'string' }, 'password-env': { type: 'string' }, auth: { type: 'string' },
    'trust-server-certificate': { type: 'boolean' }, sqlcmd: { type: 'string' }, help: { type: 'boolean' },
    'zed-file': { type: 'boolean' },
  } });
  const [action, name, file] = positionals;
  const path = values.profiles ? resolve(values.profiles) : defaultProfilesPath();
  if (values.help) {
    console.log(`Usage:
  node bin/query.js add NAME --server HOST --database DB --user USER [--password-env ENV]
  node bin/query.js add NAME --server HOST --database DB --auth integrated
  node bin/query.js list
  node bin/query.js run NAME FILE [--sqlcmd PATH]
  node bin/query.js run NAME --zed-file
All commands accept --profiles PATH. Passwords are never stored in profiles.
Add accepts --trust-server-certificate for explicitly trusting a self-signed server.
Run executes the saved file, including all GO batches. Results appear in the terminal.`);
  } else if (action === 'add' && positionals.length === 2) {
    if (values.sqlcmd || values['zed-file']) throw new Error('--sqlcmd and --zed-file apply only to run.');
    const profile = {
      server: values.server, database: values.database, auth: values.auth || 'sql',
      ...(values.user !== undefined ? { user: values.user } : {}),
      ...(values['password-env'] !== undefined ? { passwordEnv: values['password-env'] } : {}),
      ...(values['trust-server-certificate'] ? { trustServerCertificate: true } : {}),
    };
    await addProfile(path, name, profile);
    console.log(`Saved ${name} in ${path}`);
  } else if ((action === 'list' && positionals.length === 1) ||
    (action === 'run' && (values['zed-file'] ? positionals.length === 2 : positionals.length === 3))) {
    const allowed = action === 'list' ? ['profiles'] : ['profiles', 'sqlcmd', 'zed-file'];
    if (Object.keys(values).some(key => !allowed.includes(key))) throw new Error(`Unsupported option for ${action}.`);
    const profiles = await readProfiles(path);
    if (action === 'list') {
      for (const [key, p] of Object.entries(profiles)) console.log(`${key}\t${p.server}\t${p.database}\t${p.auth}`);
      if (!Object.keys(profiles).length) console.log(`No profiles. Add one with the add command. Location: ${path}`);
    } else {
      if (!Object.hasOwn(profiles, name)) throw new Error(`Unknown profile: ${name}`);
      const inputFile = values['zed-file'] ? process.env.ZED_FILE : file;
      if (!inputFile) throw new Error('No active saved file. Open a saved SQL file in Zed.');
      const fullPath = resolve(inputFile);
      if (!(await stat(fullPath)).isFile()) throw new Error('Query input must be a file.');
      const command = queryCommand(profiles[name], fullPath);
      console.error(`Running ${fullPath} on ${name} (${profiles[name].server} / ${profiles[name].database})`);
      process.exitCode = await runQuery(values.sqlcmd || 'sqlcmd', command);
    }
  } else throw new Error('Invalid command. Use --help.');
} catch (error) {
  console.error(`zed-mssql: ${error.message}`);
  process.exitCode = 1;
}
