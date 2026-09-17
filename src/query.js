import { spawn } from 'node:child_process';
import { constants } from 'node:os';
import { validateProfile } from './profiles.js';

export function queryCommand(profile, file, environment = process.env) {
  validateProfile(profile);
  // sqlcmd environment defaults must not silently override the selected profile.
  const env = Object.fromEntries(Object.entries(environment).filter(([key]) => !key.toUpperCase().startsWith('SQLCMD')));
  const args = ['-S', profile.server, '-d', profile.database, '-b', '-r', '1', '-f', '65001'];
  if (profile.auth === 'integrated') args.push('-E');
  else {
    args.push('-U', profile.user);
    if (profile.passwordEnv) {
      const password = environment[profile.passwordEnv];
      if (!password) throw new Error(`Set ${profile.passwordEnv} before connecting.`);
      env.SQLCMDPASSWORD = password;
    }
  }
  if (profile.trustServerCertificate) args.push('-C');
  args.push('-i', file);
  return { args, env };
}

export function runQuery(executable, command) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, command.args, { env: command.env, stdio: 'inherit', shell: false });
    // Keep the parent alive until sqlcmd exits after cancellation.
    const interrupt = () => child.kill('SIGINT');
    process.on('SIGINT', interrupt);
    child.once('error', error => {
      process.off('SIGINT', interrupt);
      reject(error.code === 'ENOENT' ? new Error('sqlcmd not found. Install it or pass --sqlcmd /absolute/path/to/sqlcmd.') : error);
    });
    child.once('exit', (code, signal) => {
      process.off('SIGINT', interrupt);
      resolve(code ?? 128 + (constants.signals[signal] || 1));
    });
  });
}
